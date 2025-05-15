/**
 * Представляет отзыв о зарядной станции
 */
export interface StationReview {
  /** Идентификатор пользователя, оставившего отзыв */
  userId: number
  /** Имя пользователя */
  userName: string
  /** Модель автомобиля */
  carModel: string
  /** Фактическая потребляемая мощность в кВт */
  kilowatts: number
  /** Текстовый отзыв */
  message: string | null
  /** Дата создания отзыва */
  createdAt: string
  /** Оценка (от 1 до 5) */
  rating: number | null
}

/**
 * Координаты географической точки
 */
export interface Coordinates {
  /** Широта */
  latitude: number
  /** Долгота */
  longitude: number
}

/**
 * Представляет зарядную станцию Tesla
 */
export interface ChargingStation {
  /** Уникальный идентификатор станции */
  id: number
  /** Название станции */
  name: string
  /** Описание станции */
  description: string | null
  /** Географические координаты */
  coordinates: Coordinates
  /** Физический адрес станции */
  address: string | null
  /** Название провайдера станции */
  provider: string
  /** Процент успешных подключений (от 0 до 100) */
  successRate: number | null
  /** Стоимость за киловатт */
  kilowattPrice: number | null
  /** Заявленная мощность в киловаттах */
  kilowattsDeclared: number | null
  /** Отзывы пользователей о станции */
  reviews: StationReview[]
}

/**
 * Расширенная информация о станции с вычисленными значениями
 */
export interface ChargingStationWithCalculatedValues extends ChargingStation {
  /** Средний рейтинг на основе отзывов (от 0 до 5) */
  rating: number
  /** Медианная фактическая мощность в кВт на основе отзывов */
  kilowattsCalculated: number
}
