import { PRODUCTS, RECIPES, SESSIONS, type BatchKey, type Ingredient, type ProductId, type RecipeId, type SessionId, type Slot } from '@/data'
import { addDays, type ISODate } from './dates'
import { recipeIdAt } from './menu'
import { emptyDay, uid, type AppData, type DayLog, type Extra, type FridgeItem, type IdGen, type Usage } from './types'

const product = (id: ProductId) => PRODUCTS[id] as { staple?: true; meat?: true }
export const isTracked = (id: ProductId) => !product(id).staple
export const isMeat = (id: ProductId) => !!product(id).meat
const round2 = (x: number) => Math.round(x * 100) / 100

/**
 * Какие ингредиенты рецепта списываются.
 * full — свежая готовка, serve — подача порции из заготовки, batch — сама заготовка.
 * Ингредиенты с флагом pre (подготовлены заранее) не списываются никогда.
 */
export function rawFor(rid: RecipeId, mode: 'full' | 'serve' | 'batch'): Ingredient[] {
  const r = RECIPES[rid]
  const serve: readonly ProductId[] = r.serve ?? []
  return r.ing.filter((i) => {
    if (i.pre) return false
    if (mode === 'serve') return serve.includes(i.id)
    if (mode === 'batch') return !serve.includes(i.id)
    return true
  })
}

export const fridgeCount = (fridge: readonly FridgeItem[], key: BatchKey) =>
  fridge.filter((f) => f.key === key).reduce((a, f) => a + f.n, 0)

export function fridgeMap(fridge: readonly FridgeItem[]): Partial<Record<BatchKey, number>> {
  const m: Partial<Record<BatchKey, number>> = {}
  for (const f of fridge) m[f.key] = (m[f.key] ?? 0) + f.n
  return m
}

/** Холодильник всегда в одном порядке: старые порции первыми. Так отмена восстанавливает его точно. */
export const sortFridge = (fridge: FridgeItem[]) =>
  fridge.sort((a, b) => (a.cooked < b.cooked ? -1 : a.cooked > b.cooked ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

const clone = (data: AppData): AppData => structuredClone(data)
const dayLog = (data: AppData, date: ISODate): DayLog => (data.log[date] ??= emptyDay())
function dropEmptyDay(data: AppData, date: ISODate) {
  const L = data.log[date]
  if (L && !Object.keys(L.slots).length && !L.extras.length && !Object.keys(L.sessions).length) delete data.log[date]
}

function takePantry(data: AppData, id: ProductId, q: number, use: Usage) {
  if (!isTracked(id) || !q) return
  const have = data.pantry[id] ?? 0
  const t = Math.min(have, q)
  if (t <= 0) return
  data.pantry[id] = round2(have - t)
  use.pantry[id] = round2((use.pantry[id] ?? 0) + t)
}

function restore(data: AppData, use: Usage) {
  for (const [id, q] of Object.entries(use.pantry) as [ProductId, number][]) data.pantry[id] = round2((data.pantry[id] ?? 0) + q)
  for (const f of use.fridge) {
    const ex = data.fridge.find((x) => x.id === f.id)
    if (ex) ex.n += 1
    else data.fridge.push({ ...f, n: 1 })
  }
  sortFridge(data.fridge)
}

/**
 * «Съел». Если у блюда есть заготовка и порция в холодильнике, списывается самая старая порция
 * и только serve-ингредиенты. Иначе списывается весь рецепт, как при свежей готовке.
 */
export function eatMeal(data0: AppData, date: ISODate, slot: Slot): AppData {
  const data = clone(data0)
  const rid = recipeIdAt(date, slot)
  const batch = RECIPES[rid].batch
  const use: Usage = { pantry: {}, fridge: [] }
  let raw: Ingredient[]
  if (batch && fridgeCount(data.fridge, batch) > 0) {
    sortFridge(data.fridge)
    const f = data.fridge.find((x) => x.key === batch)!
    use.fridge.push({ ...f, n: 1 })
    f.n -= 1
    if (f.n <= 0) data.fridge = data.fridge.filter((x) => x !== f)
    raw = rawFor(rid, 'serve')
  } else raw = rawFor(rid, 'full')
  for (const i of raw) takePantry(data, i.id, i.q, use)
  dayLog(data, date).slots[slot] = { st: 'eaten', use, from: use.fridge.length ? 'fridge' : 'fresh' }
  return data
}

export function skipMeal(data0: AppData, date: ISODate, slot: Slot): AppData {
  const data = clone(data0)
  dayLog(data, date).slots[slot] = { st: 'skipped' }
  return data
}

/** Отмена отметки «съел» или «не ел»: возвращает ровно то, что было списано. */
export function undoMeal(data0: AppData, date: ISODate, slot: Slot): AppData {
  const e = data0.log[date]?.slots[slot]
  if (!e) return data0
  const data = clone(data0)
  if (e.st === 'eaten') restore(data, e.use)
  delete dayLog(data, date).slots[slot]
  dropEmptyDay(data, date)
  return data
}

/** «Заготовка сделана»: списывает batch-ингредиенты × порции и extra, кладёт контейнеры в холодильник. */
export function doSession(data0: AppData, sid: SessionId, today: ISODate, newId: IdGen = uid): AppData {
  const data = clone(data0)
  const s = SESSIONS[sid]
  const use: Usage = { pantry: {}, fridge: [] }
  const made: string[] = []
  for (const m of s.makes) {
    for (const i of rawFor(m.recipe, 'batch')) takePantry(data, i.id, i.q * m.n, use)
    const key = RECIPES[m.recipe].batch
    if (!key) continue
    const it: FridgeItem = {
      id: newId(),
      key,
      cooked: today,
      until: addDays(today, m.keep),
      n: m.n,
      freeze: !!m.freeze,
    }
    data.fridge.push(it)
    made.push(it.id)
  }
  for (const e of s.extra ?? []) takePantry(data, e.id, e.q, use)
  sortFridge(data.fridge)
  dayLog(data, today).sessions[sid] = { use, made }
  return data
}

export function undoSession(data0: AppData, date: ISODate, sid: SessionId): AppData {
  const e = data0.log[date]?.sessions[sid]
  if (!e) return data0
  const data = clone(data0)
  restore(data, e.use)
  data.fridge = data.fridge.filter((f) => !e.made.includes(f.id))
  delete dayLog(data, date).sessions[sid]
  dropEmptyDay(data, date)
  return data
}

/** −1/+1 на контейнере: выбросил, отдал или нашёл ещё порцию. */
export function adjustFridge(data0: AppData, id: string, delta: number): AppData {
  const data = clone(data0)
  const f = data.fridge.find((x) => x.id === id)
  if (!f) return data0
  f.n += delta
  if (f.n <= 0) data.fridge = data.fridge.filter((x) => x !== f)
  return data
}

/** Сверка кладовки: точное количество. */
export function setPantry(data0: AppData, id: ProductId, q: number): AppData {
  const data = clone(data0)
  data.pantry[id] = q > 0 ? round2(q) : 0
  return data
}

export function toggleStaple(data0: AppData, id: ProductId): AppData {
  const data = clone(data0)
  if (data.staples[id] === 'low') delete data.staples[id]
  else data.staples[id] = 'low'
  return data
}

export function stapleBought(data0: AppData, id: ProductId): AppData {
  const data = clone(data0)
  delete data.staples[id]
  return data
}

export function buy(data0: AppData, id: ProductId, qty: number, today: ISODate, newId: IdGen = uid): AppData {
  if (!(qty > 0)) return data0
  const data = clone(data0)
  data.pantry[id] = round2((data.pantry[id] ?? 0) + qty)
  data.bought.push({ id: newId(), date: today, prod: id, qty })
  return data
}

export function unbuy(data0: AppData, purchaseId: string): AppData {
  const b = data0.bought.find((x) => x.id === purchaseId)
  if (!b) return data0
  const data = clone(data0)
  data.pantry[b.prod] = Math.max(0, round2((data.pantry[b.prod] ?? 0) - b.qty))
  data.bought = data.bought.filter((x) => x.id !== purchaseId)
  return data
}

export function addExtra(data0: AppData, date: ISODate, extra: Omit<Extra, 'id'>, newId: IdGen = uid): AppData {
  const data = clone(data0)
  dayLog(data, date).extras.push({ id: newId(), ...extra })
  return data
}

export function removeExtra(data0: AppData, date: ISODate, id: string): AppData {
  if (!data0.log[date]) return data0
  const data = clone(data0)
  const L = dayLog(data, date)
  L.extras = L.extras.filter((x) => x.id !== id)
  dropEmptyDay(data, date)
  return data
}

export function setWeight(data0: AppData, date: ISODate, kg: number): AppData {
  if (!(kg >= 30 && kg <= 200)) return data0
  const data = clone(data0)
  data.weight = data.weight.filter((w) => w.d !== date)
  data.weight.push({ d: date, kg: Math.round(kg * 10) / 10 })
  data.weight.sort((a, b) => (a.d < b.d ? -1 : 1))
  return data
}

export function removeWeight(data0: AppData, date: ISODate): AppData {
  const data = clone(data0)
  data.weight = data.weight.filter((w) => w.d !== date)
  return data
}
