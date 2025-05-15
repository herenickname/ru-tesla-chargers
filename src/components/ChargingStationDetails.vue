<script setup lang="ts">
import { useChargingStationsStore } from '@/stores/chargingStations'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { getPlacemarkColor } from '@/utils/colors'

const store = useChargingStationsStore()
const station = computed(() => store.selectedStation)

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

function closeDetails() {
  store.clearSelection()
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
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
</script>

<template>
  <div v-if="station" class="station-details-panel" :class="{ 'mobile-fullscreen': isMobile }">
    <div class="details-header">
      <button class="close-btn" @click="closeDetails" :class="{ 'mobile-close-btn': isMobile }">
        &times;
      </button>
      <h2>{{ station.name }}</h2>
      <div
        class="provider-badge"
        :style="{ backgroundColor: getPlacemarkColor(station.provider), color: 'white' }"
      >
        {{ station.provider }}
      </div>
    </div>

    <div class="scrollable-content">
      <div class="detail-card">
        <h3>Информация о станции</h3>
        <div class="station-description" v-if="station.description">
          <p>{{ station.description }}</p>
        </div>
        <div class="detail-row">
          <span class="detail-label">Адрес:</span>
          <span class="detail-value">{{ station.address }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Заявленная мощность:</span>
          <span class="detail-value">{{ station.kilowattsDeclared }} кВт</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Фактическая мощность:</span>
          <span class="detail-value">{{ station.kilowattsCalculated }} кВт</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Успешные сессии:</span>
          <span class="detail-value">
            <div class="success-rate-detail">
              <div
                class="success-rate-bar-detail"
                :style="{ width: `${station.successRate || 100}%` }"
                :class="getSuccessRateClass(station.successRate || 100)"
              ></div>
              <span class="success-rate-percent">{{ station.successRate || 100 }}%</span>
            </div>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Рейтинг:</span>
          <span class="detail-value stars"
            >{{ getRatingStars(station.rating) }} ({{ station.rating }})</span
          >
        </div>
        <div class="detail-row">
          <span class="detail-label">Стоимость:</span>
          <span class="detail-value">{{ station.kilowattPrice }} ₽/кВт⋅ч</span>
        </div>
      </div>

      <div class="reviews-section">
        <h3>
          Отзывы <span class="reviews-count">({{ station.reviews.length }})</span>
        </h3>

        <div v-for="review in station.reviews" :key="review.createdAt" class="review-card">
          <div class="review-header">
            <span class="author">{{ review.userName }}</span>
            <span class="date">{{ formatDate(review.createdAt) }}</span>
          </div>
          <div class="review-rating">
            <span class="stars">{{ getRatingStars(review.rating || 0) }}</span>
          </div>
          <div class="review-details">
            <div v-if="review.carModel" class="review-car-model">
              <span class="car-icon">🚗</span> {{ review.carModel }}
            </div>
            <div v-if="review.kilowatts" class="review-charging-power">
              <span class="power-icon">⚡</span> {{ review.kilowatts }} кВт
            </div>
          </div>
          <div class="review-comment">
            {{ review.message }}
          </div>
        </div>

        <!-- Вспомогательный элемент для обеспечения прокрутки до конца на iOS -->
        <div class="scroll-helper"></div>
      </div>
    </div>
  </div>
  <div v-else class="no-selection-message">
    <div class="message-content">
      <div class="info-icon">ℹ️</div>
      <h3>Выберите зарядную станцию</h3>
      <p>
        Выберите зарядную станцию из списка слева или кликните по маркеру на карте для просмотра
        подробной информации.
      </p>
    </div>
  </div>
</template>

<style scoped>
.station-details-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  display: flex;
  flex-direction: column;
  z-index: 2;
  animation: slide-in 0.3s ease;
}

/* Стиль для мобильного полноэкранного режима */
.mobile-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1500;
  border-radius: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  animation: slide-up 0.3s ease;
  display: flex;
  flex-direction: column;
}

/* Контейнер для прокручиваемого содержимого */
.scrollable-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* Для плавной инерционной прокрутки на iOS */
  padding-bottom: env(safe-area-inset-bottom, 0); /* Учитываем нижнюю безопасную область на iOS */
}

.details-header {
  position: relative;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.close-btn {
  position: absolute;
  right: 1rem;
  top: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  height: 2rem;
  width: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #495057;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

/* Стиль для крестика на мобильных устройствах */
.mobile-close-btn {
  height: 2.5rem;
  width: 2.5rem;
  font-size: 2rem;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 1600;
  right: 0.75rem;
  top: 0.75rem;
}

.mobile-close-btn:hover {
  background-color: #f8f9fa;
}

.details-header h2 {
  margin: 0 0 0.5rem 0;
  padding-right: 2rem;
  color: #212529;
  font-weight: 700;
  font-size: 1.5rem;
}

.provider-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.detail-card,
.reviews-section {
  background-color: white;
  padding: 1.5rem;
  margin: 0.75rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.detail-card h3,
.reviews-section h3 {
  margin-top: 0;
  color: #343a40;
  font-weight: 600;
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  margin-bottom: 0.75rem;
  align-items: baseline;
}

.detail-label {
  font-weight: 500;
  color: #495057;
  width: 120px;
  flex-shrink: 0;
}

.detail-value {
  color: #343a40;
  flex: 1;
}

.stars {
  color: #fcc419;
  letter-spacing: -1px;
}

.station-description {
  margin-bottom: 1.25rem;
  padding: 0.75rem;
  background-color: #f1f3f5;
  border-radius: 6px;
  border-left: 4px solid #339af0;
}

.station-description p {
  color: #495057;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

.success-rate-detail {
  position: relative;
  width: 100%;
  height: 1.2rem;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.success-rate-bar-detail {
  height: 100%;
  transition: width 0.3s ease;
}

.success-rate-bar-detail.excellent {
  background-color: #40c057;
}

.success-rate-bar-detail.good {
  background-color: #82c91e;
}

.success-rate-bar-detail.average {
  background-color: #fcc419;
}

.success-rate-bar-detail.poor {
  background-color: #ff6b6b;
}

.success-rate-percent {
  position: absolute;
  right: 5px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #212529;
  z-index: 1;
}

.reviews-count {
  color: #868e96;
  font-size: 0.9rem;
  font-weight: normal;
}

.review-card {
  padding: 1rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  margin-bottom: 0.75rem;
}

.review-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.author {
  font-weight: 500;
  color: #212529;
  font-size: 1.05rem;
}

.date {
  font-size: 0.85rem;
  color: #868e96;
}

.review-rating {
  margin-bottom: 0.5rem;
}

.review-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.review-car-model {
  font-size: 0.9rem;
  color: #495057;
  background-color: #e9ecef;
  padding: 0.35rem 0.75rem;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
}

.review-charging-power {
  font-size: 0.9rem;
  color: #495057;
  background-color: #e7f5ff;
  padding: 0.35rem 0.75rem;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
}

.car-icon,
.power-icon {
  margin-right: 0.3rem;
}

.review-comment {
  font-size: 0.95rem;
  color: #495057;
  line-height: 1.5;
}

.no-selection-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #868e96;
}

.message-content {
  max-width: 320px;
}

.info-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.message-content h3 {
  margin: 0 0 0.5rem;
  color: #495057;
}

.message-content p {
  margin: 0;
  color: #868e96;
}

@media (max-width: 768px) {
  .details-header {
    padding: 1rem;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  }

  .details-header h2 {
    font-size: 1.3rem;
    padding-right: 2.5rem;
  }

  .detail-card,
  .reviews-section {
    margin: 0.5rem;
    padding: 1rem;
    border-radius: 12px;
  }

  .reviews-section {
    margin-bottom: 2rem;
    padding-bottom: 4rem; /* Больший отступ внизу для обеспечения прокрутки */
    position: relative;
  }

  .detail-row {
    flex-direction: column;
  }

  .detail-label {
    width: 100%;
    margin-bottom: 0.25rem;
  }

  .review-card {
    padding: 0.75rem;
  }

  .review-card:last-child {
    margin-bottom: 20px;
  }

  .review-header {
    flex-direction: column;
  }

  .author {
    margin-bottom: 0.25rem;
  }

  .scroll-helper {
    height: 50px;
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* Вспомогательный элемент для обеспечения полной прокрутки на iOS */
.scroll-helper {
  height: 30px;
  width: 1px;
}
</style>
