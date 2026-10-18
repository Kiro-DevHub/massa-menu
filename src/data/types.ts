import type { ProductId } from './products'
import type { BatchKey, RecipeId } from './recipes'

export type Unit = 'г' | 'мл' | 'шт'

/** День недели, 0 = понедельник. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Приёмы пищи: завтрак, ланч, обед, полдник, ужин. */
export type Slot = 'b' | 'l' | 'd' | 'p' | 's'

export interface Macros {
  k: number
  p: number
  f: number
  c: number
}

export interface Product {
  name: string
  /** Нет у бакалеи, которую считаем без единиц. */
  unit?: Unit
  /** Индекс в CATEGORIES. */
  cat: number
  /** Сырое мясо или рыба: подсказки про морозилку. */
  meat?: true
  /** Бакалея: граммы не считаем, только «есть / заканчивается». */
  staple?: true
  /** Шаг округления покупки, если нет упаковки. */
  step?: number
  /** Размер упаковки для округления покупки. */
  pack?: number
}

export interface Ingredient {
  id: ProductId
  q: number
  note?: string
  /** Подготовлено заранее (засоленная горбуша): при еде не списывается. */
  pre?: true
}

export interface Step {
  text: string
  /** Секунды. */
  timer?: number
  timerLabel?: string
}

/** b — завтрак, l — ланч, p — полдник, m — обед или ужин. */
export type RecipeKind = 'b' | 'l' | 'p' | 'm'

export interface Recipe extends Macros {
  name: string
  kind: RecipeKind
  /** Минуты. */
  time: number
  /** Ключ контейнера в холодильнике, если блюдо делается заготовкой. */
  batch?: BatchKey
  /** Что докладывается свежим при подаче порции из заготовки. */
  serve?: readonly ProductId[]
  fresh?: true
  ing: readonly Ingredient[]
  steps: readonly Step[]
  tips?: readonly string[]
  reheat?: string
}

export interface SlotInfo {
  key: Slot
  name: string
  time: string
}

export type DayMenu = Readonly<Record<Slot, RecipeId>>

export interface SessionMake {
  recipe: RecipeId
  n: number
  /** Сколько дней хранится. */
  keep: number
  freeze?: true
}

export interface Session {
  name: string
  day: Weekday
  when: 'morning' | 'evening'
  /** Минуты. */
  time: number
  covers: string
  makes: readonly SessionMake[]
  extra?: readonly { id: ProductId; q: number }[]
  note?: string
  steps: readonly Step[]
}

export interface Preset extends Macros {
  name: string
}
