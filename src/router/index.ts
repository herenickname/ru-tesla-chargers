import { createRouter, createWebHistory } from 'vue-router'
import ChargerMapView from '../views/ChargerMapView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: ChargerMapView,
    },
  ],
})

export default router
