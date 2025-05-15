<script setup lang="ts">
import { ref, computed, watch, shallowRef, nextTick } from 'vue'
import { useChargingStationsStore } from '@/stores/chargingStations'
import type { YMap } from '@yandex/ymaps3-types'
import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapMarker,
  YandexMapClusterer,
  YandexMapHint,
  YandexMapListener,
} from 'vue-yandex-maps'

// Функция для debounce обработчика событий (ограничение частоты вызовов)
function debounce(fn: Function, delay: number) {
  let timeout: number | null = null

  return function (...args: any[]) {
    if (timeout !== null) {
      clearTimeout(timeout)
    }

    timeout = window.setTimeout(() => {
      fn(...args)
      timeout = null
    }, delay)
  }
}

const store = useChargingStationsStore()

// Используем shallowRef для хранения экземпляра карты
const map = shallowRef<null | YMap>(null)
const mapContainer = ref<null | HTMLElement>(null)

const zoom = ref(10)
const center = ref<[number, number]>([37.618423, 55.751244]) // Центр Москвы
const selectedStation = computed(() => store.selectedStation)

// Расчет смещения для центрирования на широкоформатных экранах
const calculateCenterOffset = () => {
  if (!mapContainer.value) return [0, 0]

  const mapRect = mapContainer.value.getBoundingClientRect()
  const windowCenterX = window.innerWidth / 2
  const mapCenterX = mapRect.left + mapRect.width / 2

  // Разница между центром окна и центром карты (в пикселях)
  const offsetX = windowCenterX - mapCenterX

  // Примерное соотношение пикселей к градусам долготы (зависит от широты и зума)
  // При зуме 12 на широте Москвы это примерно 1 пиксель ≈ 0.00003 градуса долготы
  // Но для разных регионов и масштабов может потребоваться другой коэффициент
  const pixelToLongitude = 0.00013 * (15 / zoom.value)

  // Возвращаем смещение в формате [долгота, широта]
  return [offsetX * pixelToLongitude, 0]
}

// Изменение центра карты при выборе станции
watch(selectedStation, async (newStation) => {
  if (newStation && map.value) {
    // Сначала установим стандартные координаты
    center.value = [newStation.coordinates.longitude, newStation.coordinates.latitude] as [
      number,
      number,
    ] // В YMaps3 порядок координат: [долгота, широта]
    zoom.value = 13

    // Дождемся следующего тика, чтобы DOM обновился
    await nextTick()

    // Рассчитаем смещение центра для компенсации положения карты
    const [offsetLong, offsetLat] = calculateCenterOffset()
    const adjustedCenter: [number, number] = [
      center.value[0] - offsetLong,
      center.value[1] - offsetLat,
    ]

    // Перемещаем карту к выбранной станции с учетом смещения
    map.value.setLocation({
      center: adjustedCenter,
      zoom: zoom.value,
    })
  }
})

// Обновляем карту при изменении ссылки на карту
watch(map, (newMap) => {
  // Обработчик изменения объекта карты
})

// Функция для обновления центра карты с ограничением частоты вызовов (раз в секунду)
const updateMapCenter = (e: any) => {
  if (e.location?.center) {
    // Обновляем центр карты в хранилище и локальное значение
    store.updateMapCenter(e.location.center[0], e.location.center[1])
  }
}

// Создаем debounced-версию функции обновления центра карты
const debouncedUpdateMapCenter = debounce(updateMapCenter, 1000)

// Создаем реактивное свойство для маркеров станций
// Это понадобится для рендеринга маркеров в шаблоне
const stationMarkers = computed(() => {
  // Отображаем маркеры для всех станций, включая отфильтрованные, но с разным стилем
  return store.allStations.map((station) => {
    // Правильный формат координат для LngLat, точно 2 элемента [долгота, широта]
    const coordinates: [number, number] = [
      station.coordinates.longitude,
      station.coordinates.latitude,
    ]

    // Проверяем, проходит ли станция по фильтру мощности
    const passesFilter = station.kilowattsCalculated >= store.powerFilter

    return {
      id: station.id,
      coordinates: coordinates,
      color: getPlacemarkColor(station.provider),
      isSelected: station.id === store.selectedStationId,
      name: station.name,
      station: station, // Добавляем всю информацию о станции
      // Меняем прозрачность для станций, не проходящих по фильтру
      opacity: passesFilter ? 1 : 0.4,
      passesFilter: passesFilter,
      properties: {
        // Дополнительные свойства для хинтов и балунов
        hint: `${station.name} (${station.kilowattsCalculated} кВт)${passesFilter ? '' : ' - не соответствует фильтру'}`,
      },
      // Можно выбирать только станции, проходящие по фильтру
      onClick: passesFilter ? () => handleMarkerClick(station.id) : () => {},
    }
  })
})

function handleMarkerClick(stationId: number) {
  store.selectStation(stationId)
}

import { getPlacemarkColor } from '@/utils/colors'

// Функции для стилизации кластеров
function getClusterClass(length: number) {
  if (length < 10) return 'cluster-small'
  if (length < 30) return 'cluster-medium'
  return 'cluster-large'
}

function getClusterStyle(length: number) {
  // Базовый размер кластера: маленький (до 10 точек), средний (до 30 точек), большой (более 30 точек)
  const baseSize = length < 10 ? 44 : length < 30 ? 54 : 64

  // Генерируем цвет градиента в зависимости от количества точек
  // От зеленого (мало) через голубой (средне) к фиолетовому (много)
  const startColor = length < 10 ? '#4CAF50' : length < 30 ? '#2196F3' : '#9C27B0'
  const endColor = length < 10 ? '#8BC34A' : length < 30 ? '#3F51B5' : '#673AB7'

  // Задаем z-index в зависимости от размера кластера, чтобы большие были выше
  const zIndex = length < 10 ? 1 : length < 30 ? 2 : 3

  return {
    width: `${baseSize}px`,
    height: `${baseSize}px`,
    background: `linear-gradient(45deg, ${startColor}, ${endColor})`,
    zIndex: zIndex.toString(),
  }
}
</script>

<template>
  <div class="map-container" ref="mapContainer">
    <yandex-map
      v-model="map"
      :settings="{
        location: {
          center: center,
          zoom: zoom,
        },
      }"
      width="100%"
      height="100%"
    >
      <yandex-map-default-scheme-layer />
      <yandex-map-default-features-layer />

      <!-- Добавим отображение радиуса поиска другим способом, например через div с абсолютным позиционированием -->
      <!-- В текущей версии библиотеки нет готового компонента для отображения круга -->

      <!-- Используем маркеры для станций зарядки -->
      <yandex-map-clusterer zoom-on-cluster-click :gridSize="120">
        <yandex-map-marker
          v-for="marker in stationMarkers"
          :key="marker.id"
          :settings="{
            coordinates: marker.coordinates,
            draggable: false,
            onClick: marker.onClick,
            properties: marker.properties,
          }"
          position="top left-center"
        >
          <div
            class="custom-marker"
            :class="{
              'marker-selected': marker.isSelected,
              'marker-filtered': !marker.passesFilter,
            }"
            :style="{
              backgroundColor: marker.isSelected ? '#FF5722' : marker.color,
              opacity: marker.opacity,
            }"
          >
            <span class="marker-icon">⚡</span>
            <div v-if="marker.isSelected" class="marker-pulse"></div>
          </div>
        </yandex-map-marker>

        <template #cluster="{ length }">
          <div class="cluster" :class="getClusterClass(length)" :style="getClusterStyle(length)">
            <span class="cluster-count">
              <span class="cluster-icon">⚡</span>
              {{ length }}
            </span>
          </div>
        </template>
      </yandex-map-clusterer>

      <!-- Добавляем поддержку хинтов при наведении на маркеры -->
      <yandex-map-hint hint-property="hint">
        <template #default="{ content }">
          <div class="map-hint">
            {{ content }}
          </div>
        </template>
      </yandex-map-hint>
      <yandex-map-listener
        :settings="{
          onUpdate: (e: any) => debouncedUpdateMapCenter(e),
        }"
      />
    </yandex-map>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.ymap-container {
  width: 100%;
  height: 100%;
}

.map-hint {
  position: absolute;
  padding: 8px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
  opacity: 0.9;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transform: translate(8px, -50%);
  z-index: 10;
}

.stations-count {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: #495057;
  text-align: center;
  border-top: 1px solid #e9ecef;
  padding-top: 0.5rem;
}

.filter-hint {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #fa5252;
  font-style: italic;
}

/* Стили для кластеров */

/* Стили для кластеров */
.cluster {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: linear-gradient(45deg, #2196f3, #3f51b5);
  color: white;
  font-weight: bold;
  border-radius: 50%;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.3),
    inset 0 1px 3px rgba(255, 255, 255, 0.3);
  font-size: 16px;
  border: 2px solid white;
  backdrop-filter: blur(2px);
  transition: all 0.2s ease;
}

.cluster-small {
  font-size: 16px;
}

.cluster-medium {
  font-size: 18px;
}

.cluster-large {
  font-size: 20px;
  font-weight: 800;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.cluster:hover {
  transform: scale(1.1);
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  animation: none;
}

.cluster-count {
  position: relative;
  z-index: 1;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.cluster-icon {
  font-size: 0.9em;
  margin-right: 1px;
  display: inline-block;
}

/* Стили для маленьких кластеров */
.cluster-small {
  background: linear-gradient(45deg, #4caf50, #8bc34a);
  font-size: 16px;
}

/* Стили для средних кластеров */
.cluster-medium {
  background: linear-gradient(45deg, #2196f3, #3f51b5);
  font-size: 18px;
}

/* Стили для больших кластеров */
.cluster-large {
  background: linear-gradient(45deg, #9c27b0, #673ab7);
  font-size: 20px;
  font-weight: 800;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

/* Стили для пользовательских маркеров */
.custom-marker {
  position: relative;
  width: 28px;
  height: 28px;
  background-color: #ff5722;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.4),
    0 0 2px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 1;
  cursor: pointer;
  transform: translateY(-50%);
}

.custom-marker:hover {
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.marker-icon {
  font-size: 14px;
  color: white;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
}

.marker-selected {
  z-index: 2;
  width: 34px;
  height: 34px;
  border: 3px solid white;
  box-shadow:
    0 0 0 2px rgba(255, 87, 34, 0.5),
    0 4px 8px rgba(0, 0, 0, 0.6);
  animation: bounce 0.5s ease-out;
}

.marker-selected .marker-icon {
  font-size: 16px;
}

.marker-filtered {
  filter: grayscale(50%);
}

.marker-pulse {
  position: absolute;
  width: 44px;
  height: 44px;
  background-color: rgba(255, 87, 34, 0.4);
  border-radius: 50%;
  opacity: 1;
  pointer-events: none;
  z-index: -1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  70% {
    transform: scale(1.5);
    opacity: 0;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes bounce {
  0% {
    transform: translateY(-50%) scale(0.8);
  }
  50% {
    transform: translateY(-50%) scale(1.2);
  }
  100% {
    transform: translateY(-50%) scale(1);
  }
}
</style>
