import { SESSIONS, SLOTS, type Macros, type ProductId, type SessionId, type Slot } from '@/data'
import type { ISODate } from './dates'
import { recipeAt, recipeIdAt } from './menu'
import { rawFor } from './stock'
import type { AppData, MealSnapshot } from './types'

const zero = (): Macros => ({ k: 0, p: 0, f: 0, c: 0 })
const add = (t: Macros, m: Macros) => {
  t.k += m.k
  t.p += m.p
  t.f += m.f
  t.c += m.c
}

/** План дня по меню. */
export function dayPlan(date: ISODate): Macros {
  const t = zero()
  for (const sl of SLOTS) add(t, recipeAt(date, sl.key))
  return t
}

/**
 * Что было отмечено в приёме: снапшот из лога, а для записей без снапшота — блюдо из текущего меню.
 * Так смена меню не меняет прошлые дни.
 */
export function loggedMeal(data: AppData, date: ISODate, slot: Slot): MealSnapshot {
  const snap = data.log[date]?.slots[slot]?.meal
  if (snap) return snap
  const rid = recipeIdAt(date, slot)
  const r = recipeAt(date, slot)
  return { rid, name: r.name, k: r.k, p: r.p, f: r.f, c: r.c }
}

/** Съедено за день: отмеченные приёмы (по снапшоту) и еда вне меню. */
export function dayEaten(data: AppData, date: ISODate): Macros {
  const t = zero()
  const L = data.log[date]
  if (!L) return t
  for (const sl of SLOTS) if (L.slots[sl.key]?.st === 'eaten') add(t, loggedMeal(data, date, sl.key))
  for (const x of L.extras) add(t, x)
  return t
}

/** Ближайший неотмеченный приём (только для сегодняшнего дня). */
export function nextSlot(data: AppData, today: ISODate, date: ISODate): Slot | null {
  if (date !== today) return null
  return SLOTS.find((s) => !data.log[date]?.slots[s.key])?.key ?? null
}

/** Точки прогресса дня: съедено ли каждое из 5 блюд. */
export const dayDots = (data: AppData, date: ISODate) => SLOTS.map((s) => data.log[date]?.slots[s.key]?.st === 'eaten')

/** Сводный список «понадобится» для заготовки, включая extra. */
export function sessionNeeds(sid: SessionId): { id: ProductId; q: number; note?: string }[] {
  const s = SESSIONS[sid]
  const tot = new Map<ProductId, { q: number; note?: string }>()
  for (const m of s.makes)
    for (const i of rawFor(m.recipe, 'batch')) {
      const cur = tot.get(i.id)
      tot.set(i.id, { q: (cur?.q ?? 0) + i.q * m.n, note: cur?.note ?? i.note })
    }
  for (const e of s.extra ?? []) tot.set(e.id, { q: (tot.get(e.id)?.q ?? 0) + e.q, note: tot.get(e.id)?.note })
  return [...tot].map(([id, v]) => ({ id, ...v }))
}
