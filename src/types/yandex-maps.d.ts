// Типы для Yandex Maps API

declare module 'vue-yandex-maps' {
  import { App, Component } from 'vue'

  export interface YMapsSettings {
    /**
     * API ключ Яндекс Карт
     */
    apikey: string
    /**
     * Локализация карт
     */
    lang: string
    /**
     * Координаты по умолчанию
     */
    coordorder?: string
    /**
     * Версия API
     */
    version?: string
    /**
     * Предзагрузка API
     */
    preload?: boolean
    /**
     * Иконка для скрывающейся кнопки
     */
    suggestionsLimit?: number
    /**
     * Дополнительные модули Yandex Maps
     */
    modules?: string[]
    /**
     * Использовать enterprise версию API
     */
    enterprise?: boolean
  }

  export function createYmaps(settings: YMapsSettings): {
    install: (app: App) => void
  }

  export const YandexMap: Component
  export const YandexMapDefaultSchemeLayer: Component
  export const YandexMapDefaultFeaturesLayer: Component
  export const YandexMapMarker: Component
  export const YandexMapListener: Component
  export const YandexMapHint: Component
  export const YandexMapClusterer: Component
}

declare module '@yandex/ymaps3-types' {
  export interface YMapLocationRequest {
    center?: number[] | null
    zoom?: number | null
  }

  export interface YMapLocation {
    center?: number[] | null
    zoom?: number | null
  }

  export interface YMap {
    getCenter(): number[]
    getZoom(): number
    setLocation(options: YMapLocationRequest): void
    getLocation(): YMapLocation
  }
}
