import { RECIPES, SESSIONS, SLOTS, TRAIN_DAYS, type BatchKey, type SessionId, type Slot } from '@/data'
import { addDays, weekday, type ISODate } from './dates'
import { recipeAt, recipeIdAt, sessionsOn } from './menu'
import { sessionDoneAt } from './simulate'
import { fridgeMap } from './stock'
import type { AppData } from './types'

export type MealSource =
  | { kind: 'eaten'; fromFridge: boolean }
  | { kind: 'skipped' }
  /** Прошедший день без отметки. */
  | { kind: 'past' }
  /** Ланч: без готовки. */
  | { kind: 'noCook' }
  /** Полдник в день зала. */
  | { kind: 'afterGym' }
  /** Полдник в обычный день: 2 минуты. */
  | { kind: 'quick' }
  /** Порция появится из заготовки, которая ещё будет. */
  | { kind: 'fromSession'; date: ISODate }
  | { kind: 'freezer' }
  | { kind: 'fridge' }
  /** Блюдо из заготовки, но порции не будет: готовить свежим. */
  | { kind: 'missing' }
  | { kind: 'fresh'; minutes: number }

/** Откуда возьмётся блюдо: моделирует холодильник от сегодня до этого приёма. */
export function mealSource(data: AppData, today: ISODate, date: ISODate, slot: Slot): MealSource {
  const r = recipeAt(date, slot)
  const e = data.log[date]?.slots[slot]
  if (e) return e.st === 'eaten' ? { kind: 'eaten', fromFridge: e.from === 'fridge' } : { kind: 'skipped' }
  if (date < today) return { kind: 'past' }
  if (r.kind === 'l') return { kind: 'noCook' }
  if (r.kind === 'p') return TRAIN_DAYS.includes(weekday(date)) ? { kind: 'afterGym' } : { kind: 'quick' }
  if (r.batch) {
    const batch: BatchKey = r.batch
    const fr = fridgeMap(data.fridge)
    let avail: boolean | null = null
    let src: ISODate | null = null
    /** Кладёт порции заготовок в симулируемый холодильник; true, если среди них наше блюдо. */
    const add = (when: 'morning' | 'evening', sess: SessionId[]) => {
      let ours = false
      for (const id of sess) {
        const s = SESSIONS[id]
        if (s.when !== when) continue
        for (const m of s.makes) {
          const k = RECIPES[m.recipe].batch
          if (!k) continue
          fr[k] = (fr[k] ?? 0) + m.n
          if (k === batch) ours = true
        }
      }
      return ours
    }
    for (let x = today; x <= date; x = addDays(x, 1)) {
      const L = data.log[x]
      const sess = sessionsOn(x).filter((id) => !sessionDoneAt(data.log, id, x))
      if (add('morning', sess)) src = x
      for (const s2 of SLOTS) {
        if (L?.slots[s2.key]) continue
        if (x === date && s2.key === slot) {
          avail = (fr[batch] ?? 0) > 0
          break
        }
        const b2 = RECIPES[recipeIdAt(x, s2.key)].batch
        if (b2 && (fr[b2] ?? 0) > 0) fr[b2] = (fr[b2] ?? 0) - 1
      }
      if (avail !== null) break
      if (add('evening', sess)) src = x
    }
    if (avail) {
      if (src) return { kind: 'fromSession', date: src }
      return batch === 'syrniki' ? { kind: 'freezer' } : { kind: 'fridge' }
    }
    return { kind: 'missing' }
  }
  return { kind: 'fresh', minutes: r.time }
}
