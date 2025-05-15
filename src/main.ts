import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createYmaps } from 'vue-yandex-maps'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(
  createYmaps({
    apikey: import.meta.env.VITE_YANDEX_MAPS_API_KEY, // API ключ из переменной окружения
    lang: 'ru_RU',
  }),
)

app.mount('#app')
