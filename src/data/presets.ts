// Перенесено 1-в-1 из reference/menu-reference.html. Паритет проверяет src/data/data-parity.test.ts.
import type { Preset } from './types'

/** Еда вне меню: средние значения, этого хватает для учёта. */
export const PRESETS: readonly Preset[] = [
  { name: "Шаурма из ларька", k: 650, p: 30, f: 30, c: 65 },
  { name: "Пицца, 2 куска", k: 600, p: 24, f: 24, c: 70 },
  { name: "Бургер", k: 550, p: 28, f: 28, c: 45 },
  { name: "Бизнес-ланч", k: 800, p: 35, f: 30, c: 95 },
  { name: "Картошка фри, средняя", k: 340, p: 4, f: 17, c: 43 },
  { name: "Газировка 0,5 л", k: 210, p: 0, f: 0, c: 53 },
]
