import { addDays, type ISODate } from './dates'
import type { WeightEntry } from './types'

/** Среднее за 7 дней, заканчивая end (включительно). */
export function avg7(weights: readonly WeightEntry[], end: ISODate): number | null {
  const st = addDays(end, -6)
  const xs = weights.filter((w) => w.d >= st && w.d <= end).map((w) => w.kg)
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
}

export interface WeightStats {
  cur: number | null
  prev: number | null
  delta: number | null
}

/** Среднее за неделю против среднего 14 дней назад. */
export function weightStats(weights: readonly WeightEntry[], today: ISODate): WeightStats {
  const cur = avg7(weights, today)
  const prev = avg7(weights, addDays(today, -14))
  return { cur, prev, delta: cur != null && prev != null ? cur - prev : null }
}

export type WeightAdvice = 'none' | 'slow' | 'fast' | 'ok'

/** Прирост за две недели: < 0,25 кг — мало, > 1,4 кг — быстро, иначе темп хороший. */
export function weightAdvice(delta: number | null): WeightAdvice {
  if (delta == null) return 'none'
  if (delta < 0.25) return 'slow'
  if (delta > 1.4) return 'fast'
  return 'ok'
}
