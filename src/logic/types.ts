import type { BatchKey, Macros, ProductId, SessionId, Slot } from '@/data'
import type { ISODate } from './dates'

export interface FridgeItem {
  id: string
  key: BatchKey
  cooked: ISODate
  until: ISODate
  n: number
  freeze: boolean
}

/** Что именно списала отметка. Отмена возвращает ровно это. */
export interface Usage {
  pantry: Partial<Record<ProductId, number>>
  fridge: FridgeItem[]
}

/**
 * Что было в тарелке в момент отметки. История дня рендерится из снапшота,
 * поэтому смена меню не переписывает прошлые дни. У записей до v2 снапшота может не быть.
 */
export interface MealSnapshot extends Macros {
  /** Id рецепта на момент отметки (может уже не существовать в справочнике). */
  rid: string
  name: string
}

export type SlotEntry =
  | { st: 'eaten'; use: Usage; from: 'fridge' | 'fresh'; meal?: MealSnapshot }
  | { st: 'skipped'; meal?: MealSnapshot }

export interface Extra extends Macros {
  id: string
  name: string
}

export interface SessionMark {
  use: Usage
  made: string[]
}

export interface DayLog {
  slots: Partial<Record<Slot, SlotEntry>>
  extras: Extra[]
  sessions: Partial<Record<SessionId, SessionMark>>
}

export interface Purchase {
  id: string
  date: ISODate
  prod: ProductId
  qty: number
}

export interface WeightEntry {
  d: ISODate
  kg: number
}

export interface AppData {
  /** Кладовка: сырые продукты в г/мл/шт. */
  pantry: Partial<Record<ProductId, number>>
  /** Бакалея, которая заканчивается. */
  staples: Partial<Record<ProductId, 'low'>>
  /** Холодильник: готовые порции. */
  fridge: FridgeItem[]
  log: Record<ISODate, DayLog>
  bought: Purchase[]
  weight: WeightEntry[]
}

export const emptyData = (): AppData => ({ pantry: {}, staples: {}, fridge: [], log: {}, bought: [], weight: [] })
export const emptyDay = (): DayLog => ({ slots: {}, extras: [], sessions: {} })

export type IdGen = () => string
export const uid: IdGen = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
