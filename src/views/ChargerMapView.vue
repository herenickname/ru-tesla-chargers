<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import ChargingStationsList from '@/components/ChargingStationsList.vue'
import ChargerMapYandex from '@/components/ChargerMapYandex.vue'
import ChargingStationDetails from '@/components/ChargingStationDetails.vue'
import { useChargingStationsStore } from '@/stores/chargingStations'

const store = useChargingStationsStore()

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
</script>

<template>
  <div class="charger-map-page">
    <!-- Скрываем сайдбар с фильтром, если на мобильном устройстве открыта станция -->
    <div class="sidebar" :class="{ 'hidden-mobile': isMobile && store.selectedStation }">
      <div class="mobile-filter-container">
        <ChargingStationsList />
      </div>
    </div>
    <div class="map-section" :class="{ 'fullscreen-mobile': isMobile && store.selectedStation }">
      <ChargerMapYandex />
      <div class="station-details-overlay" v-if="store.selectedStation">
        <ChargingStationDetails />
      </div>
    </div>
  </div>
</template>

<style scoped>
.charger-map-page {
  display: flex;
  height: 100vh;
  width: 100vw;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.sidebar {
  width: 40%;
  max-width: 450px;
  min-width: 320px;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.mobile-filter-container {
  height: 100%;
}

.map-section {
  flex: 1;
  height: 100%;
  position: relative;
}

.station-details-overlay {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 400px;
  height: calc(100% - 2rem);
  max-height: calc(100% - 2rem);
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

@media (max-width: 768px) {
  .charger-map-page {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-width: none;
    height: auto;
    min-height: 120px;
    transition: all 0.3s ease;
  }

  /* Скрываем сайдбар на мобильных устройствах при просмотре станции */
  .hidden-mobile {
    height: 0;
    min-height: 0;
    overflow: hidden;
    opacity: 0;
  }

  .mobile-filter-container {
    height: 100%;
  }

  .map-section {
    height: calc(100% - 120px);
    transition: all 0.3s ease;
  }

  /* Полноэкранная карта на мобильных устройствах при просмотре станции */
  .fullscreen-mobile {
    height: 100%;
  }

  .station-details-overlay {
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    max-height: 100%;
    border-radius: 0;
    z-index: 1500;
  }
}
</style>
