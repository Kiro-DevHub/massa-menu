import { PRODUCTS, TRIP_DAYS, type ProductId } from '@/data'
import { addDays, diffDays, weekday, type ISODate } from './dates'
import { simulate } from './simulate'
import { fridgeMap, isMeat } from './stock'
import type { AppData } from './types'

type Qty = Partial<Record<ProductId, number>>

/** Ближайший день закупки начиная с from (включительно). */
export function nextTrip(from: ISODate): ISODate {
  for (let i = 0; i < 8; i++) {
    const d = addDays(from, i)
    if (TRIP_DAYS.includes(weekday(d))) return d
  }
  return from
}

/** Округление покупки вверх до упаковки или шага. */
export function roundBuy(id: ProductId, q: number) {
  const p = PRODUCTS[id]
  if (p.pack && p.pack > 1) return Math.ceil(q / p.pack - 1e-9) * p.pack
  if (p.step) return Math.ceil(q / p.step - 1e-9) * p.step
  return Math.ceil(q - 1e-9)
}

export interface Shopping {
  today: ISODate
  /** Ближайшая закупка. */
  trip: ISODate
  /** Следующая за ней. */
  after: ISODate
  /** Не хватит ещё до ближайшей закупки. */
  urgentDef: Qty
  /** Купить на ближайшей закупке, чтобы хватило до следующей (с учётом остатков). */
  tripDef: Qty
  /** Первое использование продукта за 8 дней. */
  firstUse: Partial<Record<ProductId, ISODate>>
  /** Бакалея, которая заканчивается. */
  lowStaples: ProductId[]
}

export function shopping(data: AppData, today: ISODate): Shopping {
  const trip = nextTrip(today)
  const after = nextTrip(addDays(trip, 1))
  const fr = fridgeMap(data.fridge)
  const urgent = simulate(data.log, today, trip, data.pantry, fr)
  const urgentDef: Qty = {}
  for (const [id, v] of Object.entries(urgent.pantry) as [ProductId, number][]) if (v < -1e-6) urgentDef[id] = -v
  const p2: Qty = {}
  for (const [id, v] of Object.entries(urgent.pantry) as [ProductId, number][]) p2[id] = Math.max(0, v)
  for (const [id, v] of Object.entries(data.pantry) as [ProductId, number][]) if (!(id in p2)) p2[id] = v
  const tripSim = simulate(data.log, trip, after, p2, urgent.fridge)
  const tripDef: Qty = {}
  for (const [id, v] of Object.entries(tripSim.pantry) as [ProductId, number][]) if (v < -1e-6) tripDef[id] = -v
  const firstUse: Shopping['firstUse'] = {}
  const all = simulate(data.log, today, addDays(today, 8), data.pantry, fr)
  for (const [id, arr] of Object.entries(all.uses) as [ProductId, { d: ISODate }[]][]) if (arr[0]) firstUse[id] = arr[0].d
  const lowStaples = (Object.keys(data.staples) as ProductId[]).filter((k) => data.staples[k] === 'low')
  return { today, trip, after, urgentDef, tripDef, firstUse, lowStaples }
}

/** Число позиций для бейджа на табе «Покупки». */
export const shoppingCount = (s: Shopping) =>
  Object.keys(s.urgentDef).length + Object.keys(s.tripDef).length + s.lowStaples.length

/** Купленное мясо сразу в морозилку, если до первого использования от закупки ≥ 2 дней. */
export function shopFreezerHint(s: Shopping, id: ProductId): ISODate | null {
  if (!isMeat(id)) return null
  const use = s.firstUse[id]
  if (!use) return null
  const from = s.trip <= s.today ? s.today : s.trip
  return diffDays(from, use) >= 2 ? use : null
}

export type PantryStatus =
  | { kind: 'shortToday' }
  | { kind: 'shortOn'; date: ISODate }
  | { kind: 'enough' }
  | { kind: 'unused' }

export interface PantryForecast {
  status: Partial<Record<ProductId, PantryStatus>>
  /** Мясо дома, которое понадобится не раньше чем через 2 дня: убрать в морозилку. */
  freezer: Partial<Record<ProductId, ISODate>>
}

/** Прогноз кладовки на неделю вперёд. */
export function pantryForecast(data: AppData, today: ISODate): PantryForecast {
  const sim = simulate(data.log, today, addDays(today, 7), data.pantry, fridgeMap(data.fridge))
  const sh = shopping(data, today)
  const status: PantryForecast['status'] = {}
  const freezer: PantryForecast['freezer'] = {}
  for (const id of Object.keys(PRODUCTS) as ProductId[]) {
    if (PRODUCTS[id].staple) continue
    const fs = sim.firstShort[id]
    if (fs) status[id] = fs === today ? { kind: 'shortToday' } : { kind: 'shortOn', date: fs }
    else if (sim.need[id]) status[id] = { kind: 'enough' }
    else status[id] = { kind: 'unused' }
    const use = sh.firstUse[id]
    if (isMeat(id) && (data.pantry[id] ?? 0) > 0 && use && diffDays(today, use) >= 2) freezer[id] = use
  }
  return { status, freezer }
}
