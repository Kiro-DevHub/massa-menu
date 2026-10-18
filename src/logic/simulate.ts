import { RECIPES, SESSIONS, SLOTS, type BatchKey, type ProductId, type SessionId } from '@/data'
import { addDays, type ISODate } from './dates'
import { recipeIdAt, sessionsOn } from './menu'
import { isTracked, rawFor } from './stock'
import type { AppData, DayLog } from './types'

type Log = AppData['log']
const peekLog = (log: Log, d: ISODate): DayLog => log[d] ?? { slots: {}, extras: [], sessions: {} }

/** Плановая заготовка на дату X считается сделанной, если её отметили в окне X−2 … X+1. Возвращает дату отметки. */
export function sessionDoneAt(log: Log, sid: SessionId, X: ISODate): ISODate | null {
  for (let i = -2; i <= 1; i++) {
    const d = addDays(X, i)
    if (log[d]?.sessions[sid]) return d
  }
  return null
}

export interface SimResult {
  /** Сколько всего понадобится. */
  need: Partial<Record<ProductId, number>>
  /** Остаток кладовки в конце (может быть отрицательным = дефицит). */
  pantry: Partial<Record<ProductId, number>>
  /** День, когда продукта впервые не хватит. */
  firstShort: Partial<Record<ProductId, ISODate>>
  /** Когда и сколько продукта уходит. */
  uses: Partial<Record<ProductId, { d: ISODate; q: number }[]>>
  /** Холодильник в конце. */
  fridge: Partial<Record<BatchKey, number>>
}

/**
 * Симуляция по дням с from (включительно) до to (не включая):
 * утренние заготовки → 5 приёмов (отмеченные пропускаются, порции берутся из холодильника) → вечерние заготовки.
 */
export function simulate(
  log: Log,
  from: ISODate,
  to: ISODate,
  pantry0: Partial<Record<ProductId, number>>,
  fridge0: Partial<Record<BatchKey, number>>,
): SimResult {
  const pantry = { ...pantry0 }
  const fr = { ...fridge0 }
  const need: SimResult['need'] = {}
  const firstShort: SimResult['firstShort'] = {}
  const uses: SimResult['uses'] = {}
  const consume = (d: ISODate, id: ProductId, q: number) => {
    if (!isTracked(id) || !q) return
    need[id] = (need[id] ?? 0) + q
    const left = (pantry[id] ?? 0) - q
    pantry[id] = left
    ;(uses[id] ??= []).push({ d, q })
    if (left < -1e-6 && !firstShort[id]) firstShort[id] = d
  }
  for (let d = from; d < to; d = addDays(d, 1)) {
    const L = peekLog(log, d)
    const sess = sessionsOn(d).filter((id) => !sessionDoneAt(log, id, d))
    const run = (id: SessionId) => {
      const s = SESSIONS[id]
      for (const m of s.makes) {
        for (const i of rawFor(m.recipe, 'batch')) consume(d, i.id, i.q * m.n)
        const k = RECIPES[m.recipe].batch
        if (k) fr[k] = (fr[k] ?? 0) + m.n
      }
      for (const e of s.extra ?? []) consume(d, e.id, e.q)
    }
    sess.filter((id) => SESSIONS[id].when === 'morning').forEach(run)
    for (const sl of SLOTS) {
      if (L.slots[sl.key]) continue
      const rid = recipeIdAt(d, sl.key)
      const b = RECIPES[rid].batch
      let raw
      if (b && (fr[b] ?? 0) > 0) {
        fr[b] = (fr[b] ?? 0) - 1
        raw = rawFor(rid, 'serve')
      } else raw = rawFor(rid, 'full')
      for (const i of raw) consume(d, i.id, i.q)
    }
    sess.filter((id) => SESSIONS[id].when === 'evening').forEach(run)
  }
  return { need, pantry, firstShort, uses, fridge: fr }
}
