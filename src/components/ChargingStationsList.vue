<script setup lang="ts">
import { useChargingStationsStore } from '@/stores/chargingStations'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { getPlacemarkColor } from '@/utils/colors'

const store = useChargingStationsStore()

const selectedId = computed(() => store.selectedStationId)
// Определяем, используется ли мобильное устройство
const isMobile = ref(window.innerWidth <= 768)

// Обработчик изменения размера окна
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

// Добавляем и удаляем слушатель события при монтировании и размонтировании компонента
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function selectStation(id: number) {
  store.selectStation(id)
}

function getRatingStars(rating: number): string {
  const fullStar = '★'
  const emptyStar = '☆'
  const roundedRating = Math.round(rating)
  return fullStar.repeat(roundedRating) + emptyStar.repeat(5 - roundedRating)
}

function getSuccessRateClass(rate: number): string {
  if (rate >= 90) return 'excellent'
  if (rate >= 70) return 'good'
  if (rate >= 50) return 'average'
  return 'poor'
}

// Функция для получения красивого текста о расстоянии до станции
function getDistanceText(station: any): string {
  const distance = store.calculateDistance(
    store.mapCenter.latitude,
    store.mapCenter.longitude,
    station.coordinates.latitude,
    station.coordinates.longitude,
  )

  // Форматируем расстояние с одним десятичным знаком, если оно меньше 10 км
  // Иначе округляем до целых
  let formattedDistance = distance < 10 ? distance.toFixed(1) : Math.round(distance).toString()

  // Добавляем "м" для расстояний меньше 1 км
  if (distance < 1) {
    formattedDistance = (distance * 1000).toFixed(0)
    return `📍 ${formattedDistance} м`
  }

  return `📍 ${formattedDistance} км`
}
</script>

<template>
  <div class="stations-list">
    <h2 class="list-header">Tesla / CCS2</h2>
    <div class="power-filter">
      <div class="power-header">
        <label for="power-slider"> Минимальная мощность </label>
        <div class="filter-actions">
          <div class="power-value">{{ store.powerFilter }} кВт</div>
          <button v-if="store.powerFilter > 0" class="reset-filter" @click="store.powerFilter = 0">
            сбросить
          </button>
        </div>
      </div>
      <div class="power-slider-container">
        <div class="power-slider-bg"></div>
        <div
          class="power-slider-progress"
          :style="{ width: `${(store.powerFilter / store.maxPower) * 100}%` }"
        ></div>
        <input
          id="power-slider"
          type="range"
          v-model="store.powerFilter"
          min="0"
          :max="store.maxPower"
          step="10"
        />
        <div style="position: absolute; top: 35px; left: 5px; right: 0">
          <div class="power-distribution">
            <div
              v-for="(count, index) in store.powerDistribution"
              :key="index"
              class="distribution-bar"
              :style="{
                height: `4px`,
                left: `${index * 20}%`,
                opacity: store.powerFilter <= (index + 1) * (store.maxPower / 5) ? 1 : 0.3,
              }"
            ></div>
          </div>
        </div>
      </div>
      <div class="power-range-labels">
        <span>0 кВт</span>
        <span>{{ Math.round(store.maxPower / 2) }} кВт</span>
        <span>{{ store.maxPower }} кВт</span>
      </div>

      <div class="stations-count">
        <div>Показано станций: {{ store.stations.length }} из {{ store.allStations.length }}</div>
        <div class="filter-hint" v-if="store.stations.length === 0">
          Нет станций с заданными параметрами. Попробуйте изменить фильтры.
        </div>
      </div>
    </div>
    <!-- Скрываем список станций на мобильных устройствах -->
    <div class="stations-container" v-if="!isMobile">
      <div
        v-for="station in store.stations"
        :key="station.id"
        class="station-item"
        :class="{ selected: station.id === selectedId }"
        @click="selectStation(station.id)"
      >
        <div class="station-header">
          <h3>{{ station.name }}</h3>
          <div
            class="provider-badge"
            :style="{ backgroundColor: getPlacemarkColor(station.provider), color: 'white' }"
          >
            {{ station.provider }}
          </div>
        </div>
        <div class="station-details">
          <div class="power-info">
            <span class="power-icon">⚡</span>
            <span>{{ station.kilowattsCalculated }}</span>
            <span class="power-label" title="Фактическая мощность">кВт</span>
          </div>
          <div class="distance-info">
            {{ getDistanceText(station) }}
          </div>
          <div class="rating">
            <span class="stars" :title="`Рейтинг: ${station.rating}`">
              {{ getRatingStars(station.rating) }}
            </span>
            <span class="reviews-count">({{ station.reviews.length }})</span>
          </div>
        </div>
        <div class="success-rate">
          <div
            class="success-rate-bar"
            :style="{ width: `${station.successRate || 100}%` }"
            :class="getSuccessRateClass(station.successRate || 100)"
          ></div>
          <span class="success-rate-text">{{ station.successRate || 100 }}% успешных сессий</span>
        </div>
        <div class="station-address">
          {{ station.address || 'Не указано' }}
        </div>
      </div>
    </div>
    <!-- Сообщение о мобильном режиме -->
    <div v-if="isMobile" class="mobile-message">Выберите станцию на карте</div>
  </div>
</template>

<style scoped>
.stations-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #f8f9fa;
  border-right: 1px solid #e9ecef;
}

.list-header {
  padding: 1rem;
  margin: 0;
  border-bottom: 1px solid #e9ecef;
  background-color: #fff;
  font-size: 1.5rem;
  font-weight: 700;
  color: #212529;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}

.power-filter,
.distance-filter {
  padding: 1rem;
  background-color: #fff;
  border-bottom: 1px solid #e9ecef;
}

.power-filter .power-header,
.distance-filter .power-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.power-filter label,
.distance-filter label {
  font-weight: 500;
  color: #495057;
}

.power-filter .filter-actions,
.distance-filter .filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.power-filter .power-value,
.distance-filter .power-value {
  font-weight: 700;
  color: #339af0;
  background-color: rgba(51, 154, 240, 0.1);
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.9rem;
}

.power-filter .reset-filter,
.distance-filter .reset-filter {
  cursor: pointer;
  background: none;
  border: none;
  font-size: 0.8rem;
  color: #868e96;
  text-decoration: underline;
  padding: 2px 4px;
}

.power-filter .reset-filter:hover,
.distance-filter .reset-filter:hover {
  color: #495057;
}

.power-slider-container {
  position: relative;
  margin: 1rem 0;
}

.power-filter input[type='range'] {
  width: 100%;
  accent-color: #339af0;
  height: 6px;
  appearance: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  margin: 0;
  position: relative;
  z-index: 2;
}

.power-slider-bg {
  position: absolute;
  height: 6px;
  background: #e9ecef;
  border-radius: 10px;
  top: 50%;
  left: 0;
  width: 100%;
  z-index: 0;
  pointer-events: none;
}

.power-slider-progress {
  position: absolute;
  height: 6px;
  background: linear-gradient(to right, #339af0, #74c0fc);
  border-radius: 10px;
  top: 50%;
  left: 0;
  z-index: 1;
  pointer-events: none;
}

.power-distribution {
  display: flex;
  justify-content: space-between;
}

.distribution-bar {
  width: 8px;
  background-color: #339af0;
  border-radius: 2px;
  bottom: 0;
  transform: translateX(-50%);
  transition: all 0.3s ease;
}

.power-filter input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: #fff;
  border: 2px solid #339af0;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 3;
}

.power-filter input[type='range']:focus {
  outline: none;
}

.power-range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #868e96;
  margin-top: 1.5rem;
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

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stations-container {
  overflow-y: auto;
  flex-grow: 1;
  padding: 0.5rem;
}

.station-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.3s ease;
}

.station-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.station-item.selected {
  background-color: #e7f5ff;
  border-left: 4px solid #339af0;
}

/* Адаптивные стили для элементов списка станций на мобильных устройствах */
@media (max-width: 768px) {
  .station-item {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .station-item:hover {
    transform: none; /* Отключаем эффект подъема на мобильных */
  }

  .station-item.selected {
    border-left-width: 3px;
  }
}

.station-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

/* Адаптация заголовка для мобильных устройств */
@media (max-width: 768px) {
  .station-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

.distance-info {
  font-size: 0.85rem;
  color: #6c757d;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-right: auto;
  margin-left: 0.75rem;
}

/* Адаптация информации о расстоянии для мобильных */
@media (max-width: 768px) {
  .distance-info {
    margin-left: 0;
    margin-top: 0.25rem;
    font-size: 0.8rem;
  }
}

.station-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #343a40;
  font-weight: 600;
}

.provider-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.station-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.power-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #495057;
}

.power-icon {
  color: #ff922b;
  font-size: 1.1rem;
}

.rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stars {
  color: #fcc419;
  letter-spacing: -1px;
}

.reviews-count {
  color: #868e96;
  font-size: 0.9rem;
}

.success-rate {
  position: relative;
  height: 0.5rem;
  background-color: #e9ecef;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.success-rate-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.success-rate-bar.excellent {
  background-color: #40c057;
}

.success-rate-bar.good {
  background-color: #82c91e;
}

.success-rate-bar.average {
  background-color: #fcc419;
}

.success-rate-bar.poor {
  background-color: #ff6b6b;
}

.success-rate-text {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 0.7rem;
  color: #495057;
  transform: translateY(-100%);
  padding: 2px 4px;
  border-radius: 2px;
}

.station-address {
  font-size: 0.9rem;
  color: #868e96;
  margin-top: 0.5rem;
}

/* Стиль для мобильного сообщения */
.mobile-message {
  padding: 0.5rem;
  text-align: center;
  color: #868e96;
  font-size: 0.9rem;
  font-style: italic;
}

@media (max-width: 768px) {
  .stations-list {
    display: flex;
    flex-direction: column;
    height: auto;
    overflow: hidden;
    border-right: none;
  }

  .list-header {
    padding: 0.5rem;
    font-size: 1.2rem;
  }

  .power-filter {
    padding: 0.5rem;
  }

  .power-filter .power-header {
    margin-bottom: 0.25rem;
  }

  .power-slider-container {
    margin: 0.5rem 0;
  }

  .power-range-labels {
    margin-top: 1rem;
  }

  .stations-count {
    margin-top: 0.5rem;
    font-size: 0.8rem;
  }
}
</style>
