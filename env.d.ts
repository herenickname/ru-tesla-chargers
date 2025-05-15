/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * API ключ Яндекс Карт
   */
  readonly VITE_YANDEX_MAPS_API_KEY: string
  // Здесь можно определить другие переменные окружения
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
