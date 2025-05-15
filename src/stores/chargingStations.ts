import { defineStore } from 'pinia'
import { type ChargingStation, type ChargingStationWithCalculatedValues } from '@/types/models'
import { ref, computed } from 'vue'
import { dataStationsReviews } from '@/types/stations-reviews.data'

/**
 * Хранилище для управления данными станций зарядки, их фильтрацией и выбором.
 */
export const useChargingStationsStore = defineStore('chargingStations', () => {
  // Состояние хранилища
  const stations = ref<ChargingStation[]>(dataStationsReviews)
  const selectedStationId = ref<number | null>(null)
  const powerFilter = ref<number>(0) // Минимальная мощность для фильтрации
  const maxPower = ref<number>(300) // Максимальная мощность для фильтрации (для ползунка)
  const mapCenter = ref<{ latitude: number; longitude: number }>({
    latitude: 55.751244,
    longitude: 37.618423,
  }) // Центр карты (Москва по умолчанию)

  /**
   * Получение станций с нормализованными значениями и рассчитанными метриками
   */
  const stationsWithCalculatedValues = computed<ChargingStationWithCalculatedValues[]>(() => {
    return stations.value.map(normalizeAndCalculateStationMetrics)
  })

  /**
   * Нормализует данные станции и рассчитывает дополнительные метрики
   */
  function normalizeAndCalculateStationMetrics(
    station: ChargingStation,
  ): ChargingStationWithCalculatedValues {
    // Нормализация данных станции
    const normalizedStation = {
      ...station,
      description: station.description || 'Нет описания',
      reviews: station.reviews || [],
      kilowattsDeclared: station.kilowattsDeclared || 0,
      kilowattPrice: station.kilowattPrice ? Number(station.kilowattPrice.toFixed(2)) : null,
    }

    // Нормализация отзывов
    normalizedStation.reviews = normalizedStation.reviews.map((review) => ({
      ...review,
      kilowatts: review.kilowatts || 0,
      rating: review.rating || 0,
      message: review.message || 'Нет комментария',
    }))

    // Расчет среднего рейтинга на основе отзывов
    const avgRating = calculateAverageRating(normalizedStation.reviews)

    // Расчет медианы мощности на основе отзывов
    const kilowattsMedian = calculateMedianPower(normalizedStation.reviews)

    return {
      ...normalizedStation,
      rating: Number(avgRating.toFixed(1)),
      kilowattsCalculated: Number(kilowattsMedian.toFixed(1)),
    }
  }

  /**
   * Рассчитывает средний рейтинг на основе отзывов
   */
  function calculateAverageRating(reviews: ChargingStation['reviews']) {
    if (reviews.length === 0) return 0

    return reviews.reduce((sum, review) => sum + review.rating!, 0) / reviews.length
  }

  /**
   * Рассчитывает медианное значение мощности на основе отзывов
   */
  function calculateMedianPower(reviews: ChargingStation['reviews']) {
    if (reviews.length === 0) return 0

    // Сортируем значения мощности для нахождения медианы
    const sortedKilowatts = reviews.map((review) => review.kilowatts).sort((a, b) => a - b)

    const mid = Math.floor(sortedKilowatts.length / 2)

    // Вычисляем медиану (среднее из двух центральных значений для четного количества элементов)
    return sortedKilowatts.length % 2 === 0
      ? (sortedKilowatts[mid - 1] + sortedKilowatts[mid]) / 2
      : sortedKilowatts[mid]
  }

  /**
   * Расчет расстояния между двумя точками координат в километрах по формуле гаверсинусов
   * @param lat1 - широта первой точки
   * @param lon1 - долгота первой точки
   * @param lat2 - широта второй точки
   * @param lon2 - долгота второй точки
   */
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const EARTH_RADIUS = 6371 // Радиус Земли в километрах

    // Преобразование градусов в радианы
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180

    const latRadian1 = toRadians(lat1)
    const lonRadian1 = toRadians(lon1)
    const latRadian2 = toRadians(lat2)
    const lonRadian2 = toRadians(lon2)

    // Разница координат
    const latDiff = latRadian2 - latRadian1
    const lonDiff = lonRadian2 - lonRadian1

    // Формула гаверсинусов
    const a =
      Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
      Math.cos(latRadian1) * Math.cos(latRadian2) * Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    // Расстояние в километрах
    return EARTH_RADIUS * c
  }

  /**
   * Обновление центра карты
   * @param longitude - долгота
   * @param latitude - широта
   */
  function updateMapCenter(longitude: number, latitude: number) {
    mapCenter.value = { latitude, longitude }
  }

  /**
   * Мемоизированный расчет расстояний от центра карты до всех станций
   * для оптимизации производительности при сортировке
   */
  const stationDistances = computed(() => {
    const center = mapCenter.value
    const distanceMap = new Map<number, number>()

    stationsWithCalculatedValues.value.forEach((station) => {
      distanceMap.set(
        station.id,
        calculateDistance(
          center.latitude,
          center.longitude,
          station.coordinates.latitude,
          station.coordinates.longitude,
        ),
      )
    })

    return distanceMap
  })

  /**
   * Отфильтрованные станции по минимальной мощности и отсортированные по расстоянию от центра карты
   */
  const filteredStations = computed(() => {
    const distances = stationDistances.value
    const minPower = powerFilter.value

    return stationsWithCalculatedValues.value
      .filter((station) => station.kilowattsCalculated >= minPower)
      .sort((stationA, stationB) => {
        const distanceA = distances.get(stationA.id) || 0
        const distanceB = distances.get(stationB.id) || 0
        return distanceA - distanceB
      })
  })

  /**
   * Распределение станций по мощности для отображения в виде гистограммы
   */
  const powerDistribution = computed(() => {
    const stations = stationsWithCalculatedValues.value
    if (!stations.length) return []

    // Создаем 5 сегментов распределения
    const segmentCount = 5
    const maxPowerValue = calculateMaxPower()
    const segmentSize = maxPowerValue / segmentCount

    const distribution = Array(segmentCount).fill(0)

    // Используем reduce вместо forEach для оптимизации
    return stations.reduce((acc, station) => {
      const segmentIndex = Math.min(
        Math.floor(station.kilowattsCalculated / segmentSize),
        segmentCount - 1,
      )
      acc[segmentIndex]++
      return acc
    }, distribution)
  })

  /**
   * Текущая выбранная станция (мемоизированная для оптимизации производительности)
   */
  const selectedStation = computed(() => {
    const id = selectedStationId.value
    if (id === null) return null

    return stationsWithCalculatedValues.value.find((station) => station.id === id) || null
  })

  /**
   * Выбор станции по идентификатору
   * @param id - идентификатор станции
   */
  function selectStation(id: number) {
    selectedStationId.value = id
  }

  /**
   * Очистка текущего выбора станции
   */
  function clearSelection() {
    selectedStationId.value = null
  }

  /**
   * Автоматически находит максимальную мощность из всех станций для ползунка
   * @returns максимальное значение мощности с запасом в кВт
   */
  const calculateMaxPower = () => {
    const stations = stationsWithCalculatedValues.value
    if (!stations.length) return 300

    // Используем reduce вместо map + Math.max для оптимизации
    const max = stations.reduce(
      (maxPower, station) => Math.max(maxPower, station.kilowattsCalculated),
      0,
    )

    // Добавляем запас и округляем до ближайших 10 кВт вверх
    const POWER_MARGIN = 20 // Запас в кВт
    const ROUND_TO = 10 // Округление до кВт

    return Math.ceil((max + POWER_MARGIN) / ROUND_TO) * ROUND_TO
  }

  // Инициализация максимального значения мощности при загрузке данных
  maxPower.value = calculateMaxPower()

  return {
    // Данные
    stations: filteredStations,
    allStations: stationsWithCalculatedValues,
    selectedStation,
    selectedStationId,
    powerFilter,
    maxPower,
    powerDistribution,
    mapCenter,

    // Методы
    selectStation,
    clearSelection,
    updateMapCenter,
    calculateDistance,
  }
})
