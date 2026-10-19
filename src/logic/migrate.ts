import type { BatchKey, Slot, Weekday } from '@/data'
import { weekday } from './dates'
import { recipeIdAt } from './menu'
import { snapshotOf, sortFridge } from './stock'
import type { AppData, MealSnapshot } from './types'

/*
  Схема v1 → v2: гуляш, люля, горбуша в фольге и тефтели заменены блюдами без духовки
  и долгой готовки. Данные пользователя (отметки, кладовка, вес, покупки) переносятся как есть.
*/

/** Порции старых блюд в холодильнике становятся порциями блюд, которые встали на их место в меню. */
export const LEGACY_BATCH: Readonly<Record<string, BatchKey>> = {
  goulash: 'stroganoff',
  lula: 'kebabmince',
  meatballs: 'curry',
}

/** Продукты, которые больше не нужны ни одному блюду. */
export const REMOVED_PRODUCTS: readonly string[] = ['beef', 'chickenMince']

/** Старые блюда (замороженная копия из v1): нужны, чтобы прошлые отметки сохранили свои КБЖУ. */
const V1_MEALS: Record<string, MealSnapshot> = {
  goulash: { rid: 'goulash', name: 'Гуляш с рисом', k: 660, p: 32, f: 16, c: 96 },
  lula: { rid: 'lula', name: 'Люля-кебаб с булгуром', k: 690, p: 39, f: 15, c: 89 },
  salmon: { rid: 'salmon', name: 'Горбуша в фольге с рисом', k: 665, p: 40, f: 11, c: 97 },
  meatballs: { rid: 'meatballs', name: 'Тефтели в томате с пастой', k: 635, p: 36, f: 12, c: 93 },
}

/** Где в меню v1 стояли заменённые блюда: день недели → приём. */
const V1_CHANGED: Partial<Record<Weekday, Partial<Record<Slot, string>>>> = {
  1: { s: 'salmon' },
  2: { s: 'goulash' },
  3: { d: 'lula', s: 'goulash' },
  4: { d: 'lula', s: 'meatballs' },
  6: { d: 'meatballs' },
}

/** Что лежало в тарелке в этот день и приём по меню v1. */
export function v1MealAt(date: string, slot: Slot): MealSnapshot {
  const old = V1_CHANGED[weekday(date)]?.[slot]
  return old ? V1_MEALS[old]! : snapshotOf(recipeIdAt(date, slot))
}

type Obj = Record<string, unknown>
const isObj = (x: unknown): x is Obj => !!x && typeof x === 'object' && !Array.isArray(x)

function mapTub(f: unknown) {
  if (isObj(f) && typeof f.key === 'string' && f.key in LEGACY_BATCH) f.key = LEGACY_BATCH[f.key]
}

function dropRemoved(map: unknown) {
  if (!isObj(map)) return
  for (const id of REMOVED_PRODUCTS) delete map[id]
}

function fixUsage(use: unknown) {
  if (!isObj(use)) return
  dropRemoved(use.pantry)
  if (Array.isArray(use.fridge)) use.fridge.forEach(mapTub)
}

/**
 * Переводит данные v1 в v2. Принимает сырой объект (из IndexedDB или бэкапа), возвращает новый.
 * - ключи контейнеров goulash/lula/meatballs → stroganoff/kebabmince/curry, в том числе в копиях внутри лога,
 *   чтобы «Отменить» возвращало порцию существующего блюда;
 * - отметкам без снапшота дописывается снапшот того, что было в меню v1;
 * - удалённые продукты убираются из кладовки, покупок и того, что списано.
 */
export function migrateDataV1toV2<T>(raw: T): T {
  if (!isObj(raw)) return raw
  const d = structuredClone(raw) as Obj
  if (Array.isArray(d.fridge)) {
    d.fridge.forEach(mapTub)
    // Тот же порядок, что держит склад (старые порции первыми): так «Съел» и отмена дают ровно исходное состояние.
    sortFridge(d.fridge as Parameters<typeof sortFridge>[0])
  }
  dropRemoved(d.pantry)
  dropRemoved(d.staples)
  if (Array.isArray(d.bought)) d.bought = d.bought.filter((b) => !(isObj(b) && REMOVED_PRODUCTS.includes(String(b.prod))))
  if (isObj(d.log))
    for (const [date, day] of Object.entries(d.log)) {
      if (!isObj(day)) continue
      if (isObj(day.slots))
        for (const [slot, e] of Object.entries(day.slots)) {
          if (!isObj(e)) continue
          fixUsage(e.use)
          if ((e.st === 'eaten' || e.st === 'skipped') && !e.meal) e.meal = v1MealAt(date, slot as Slot)
        }
      if (isObj(day.sessions)) for (const m of Object.values(day.sessions)) if (isObj(m)) fixUsage(m.use)
    }
  return d as T
}

/** Миграция целиком для сохранённого состояния стора. */
export function migratePersistedV1<S extends { data?: AppData }>(s: S): S {
  return s.data ? { ...s, data: migrateDataV1toV2(s.data) } : s
}
