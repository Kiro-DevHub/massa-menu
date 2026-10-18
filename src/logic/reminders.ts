import { RECIPES, SESSIONS, SESSION_ORDER, SLOTS, type ProductId, type SessionId } from '@/data'
import { addDays, type ISODate } from './dates'
import { recipeAt, sessionsOn } from './menu'
import { sessionDoneAt, simulate } from './simulate'
import { fridgeCount, fridgeMap, isMeat } from './stock'
import type { AppData, FridgeItem } from './types'

export type Reminder =
  /** Заготовка по плану на этот день. */
  | { type: 'session'; sid: SessionId; today: boolean }
  /** Сегодня в меню блюда из заготовки, которой нет в холодильнике. */
  | { type: 'missedSession'; sid: SessionId }
  /** Вечером переложить мясо из морозилки на завтра. */
  | { type: 'defrost'; items: { id: ProductId; q: number }[] }
  | { type: 'expired'; items: FridgeItem[] }
  | { type: 'eatToday'; items: FridgeItem[] }

/** Карточки напоминаний для дня date. Полный набор только для сегодняшнего дня. */
export function dayReminders(data: AppData, today: ISODate, date: ISODate): Reminder[] {
  const out: Reminder[] = []
  if (date !== today) {
    for (const sid of sessionsOn(date)) out.push({ type: 'session', sid, today: false })
    return out
  }
  for (const sid of sessionsOn(today)) if (!sessionDoneAt(data.log, sid, today)) out.push({ type: 'session', sid, today: true })

  // Пропущенная заготовка: блюдо из неё сегодня ещё не отмечено, а в холодильнике его нет.
  const L = data.log[today]
  const missingKeys = SLOTS.filter((s) => !L?.slots[s.key])
    .map((s) => recipeAt(today, s.key).batch)
    .filter((b): b is NonNullable<typeof b> => !!b && b !== 'syrniki' && fridgeCount(data.fridge, b) === 0)
  const todaySess = sessionsOn(today)
  for (const sid of SESSION_ORDER) {
    if (todaySess.includes(sid) || L?.sessions[sid]) continue
    if (SESSIONS[sid].makes.some((m) => missingKeys.includes(RECIPES[m.recipe].batch!))) out.push({ type: 'missedSession', sid })
  }

  // Морозилка: мясо, которое понадобится завтра. Свежекупленное (вчера или сегодня) не трогаем.
  const tm = addDays(today, 1)
  const items: { id: ProductId; q: number }[] = []
  const uses = simulate(data.log, tm, addDays(tm, 1), data.pantry, fridgeMap(data.fridge)).uses
  for (const [id, arr] of Object.entries(uses) as [ProductId, { q: number }[]][]) {
    if (!isMeat(id) || !((data.pantry[id] ?? 0) > 0)) continue
    if (data.bought.some((b) => b.prod === id && b.date >= addDays(today, -1))) continue
    items.push({ id, q: arr.reduce((a, x) => a + x.q, 0) })
  }
  if (items.length) out.push({ type: 'defrost', items })

  const expired = data.fridge.filter((f) => !f.freeze && f.until < today)
  const last = data.fridge.filter((f) => !f.freeze && f.until === today)
  if (expired.length) out.push({ type: 'expired', items: expired })
  if (last.length) out.push({ type: 'eatToday', items: last })
  return out
}
