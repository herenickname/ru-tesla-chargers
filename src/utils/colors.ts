/**
 * Генерирует цвет на основе строки провайдера
 * @param str Строка для генерации цвета
 * @returns HEX-цвет, сгенерированный на основе строки
 */
export function stringToColor(str: string) {
  let hash = 0
  str.split('').forEach((char) => {
    hash = char.charCodeAt(0) + ((hash << 5) - hash)
  })
  let color = '#'
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff
    color += value.toString(16).padStart(2, '0')
  }
  return color
}

/**
 * Получает цвет для плейсмарка станции зарядки на основе провайдера
 * @param provider Название провайдера
 * @returns HEX-цвет для отображения
 */
export function getPlacemarkColor(provider: string) {
  return stringToColor(provider.toLocaleLowerCase().trim())
}
