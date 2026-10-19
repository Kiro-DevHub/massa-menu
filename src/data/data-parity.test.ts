import { describe, expect, it } from 'vitest'
// @ts-expect-error — JS-модуль без типов, нужен только в тесте
import { loadReferenceData } from '../../scripts/reference-data.mjs'
import {
  BATCH_NAMES,
  CATEGORIES,
  MENU,
  PRESETS,
  PRODUCTS,
  RECIPES,
  SESSIONS,
  SESSION_ORDER,
  SLOTS,
  TRAIN_DAYS,
  TRIP_DAYS,
  type Ingredient,
  type Step,
} from './index'

const ref = loadReferenceData()

/*
  Всё сверяется с прототипом 1-в-1, кроме явной замены четырёх блюд (без духовки и долгой готовки):
  гуляш → бефстроганов, люля → фарш по-восточному, горбуша в фольге → горбуша на сковороде,
  тефтели → курица карри. Вместе с ними переписаны заготовки вторника и четверга.
*/
const REPLACED_RECIPES: Record<string, string> = { goulash: 'stroganoff', lula: 'kebabmince', salmon: 'salmonPan', meatballs: 'curry' }
const REPLACED_BATCHES: Record<string, string> = { goulash: 'stroganoff', lula: 'kebabmince', meatballs: 'curry' }
const REPLACED_SESSIONS = ['tue', 'thu']
const REMOVED_PRODUCTS = ['beef', 'chickenMince']
const ADDED_PRODUCTS = ['sourCream', 'curry']
const NEW_RECIPES = Object.values(REPLACED_RECIPES)

const clean = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined))

const step = (s: Step) => clean({ t: s.text, timer: s.timer, tl: s.timerLabel })
const ing = (i: Ingredient) => {
  const a: unknown[] = [i.id, i.q]
  if (i.note || i.pre) a.push(i.note ?? '')
  if (i.pre) a.push('pre')
  return a
}
const refIng = (a: unknown[]) => (a[2] === undefined || a.length > 2 ? a : a.slice(0, 2))
const flag = (v: unknown) => (v ? 1 : undefined)
const without = <T,>(o: Record<string, T>, keys: string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)))

describe('данные совпадают с прототипом, кроме явных замен', () => {
  it('категории, слоты, расписание, пресеты', () => {
    expect([...CATEGORIES]).toEqual(ref.CATS)
    expect(SLOTS.map((s) => ({ k: s.key, n: s.name, t: s.time }))).toEqual(ref.SLOTS)
    expect(TRAIN_DAYS).toEqual(ref.TRAIN)
    expect(TRIP_DAYS).toEqual(ref.TRIP_DAYS)
    expect(SESSION_ORDER).toEqual(ref.SESSION_ORDER)
    expect(PRESETS.map((p) => ({ n: p.name, k: p.k, p: p.p, f: p.f, c: p.c }))).toEqual(ref.PRESETS)
  })

  it('меню: заменённые блюда стоят ровно на местах старых', () => {
    const mapped = (ref.MENU as Record<string, string>[]).map((day) =>
      Object.fromEntries(Object.entries(day).map(([slot, rid]) => [slot, REPLACED_RECIPES[rid] ?? rid])),
    )
    expect(MENU).toEqual(mapped)
  })

  it('названия контейнеров', () => {
    const mapped = Object.fromEntries(Object.entries(ref.BATCH_NAME as Record<string, string>).filter(([k]) => !(k in REPLACED_BATCHES)))
    expect(without(BATCH_NAMES, Object.values(REPLACED_BATCHES))).toEqual(mapped)
    for (const k of Object.values(REPLACED_BATCHES)) expect(BATCH_NAMES[k as keyof typeof BATCH_NAMES], k).toBeTruthy()
  })

  it('продукты', () => {
    const ours = Object.fromEntries(
      Object.entries(PRODUCTS)
        .filter(([id]) => !ADDED_PRODUCTS.includes(id))
        .map(([id, p]) => [
          id,
          clean({ n: p.name, u: p.unit, cat: p.cat, meat: flag(p.meat), staple: flag(p.staple), step: p.step, pack: p.pack }),
        ]),
    )
    expect(ours).toEqual(without(ref.P, REMOVED_PRODUCTS))
  })

  it('рецепты, кроме заменённых', () => {
    for (const [id, x] of Object.entries(ref.R as Record<string, { ing: unknown[][]; steps: unknown[] }>)) {
      if (id in REPLACED_RECIPES) {
        expect(id in RECIPES, `${id} должен быть убран`).toBe(false)
        continue
      }
      const r = RECIPES[id as keyof typeof RECIPES]
      expect(r, id).toBeDefined()
      expect(
        clean({ n: r.name, kind: r.kind, k: r.k, p: r.p, f: r.f, c: r.c, time: r.time, batch: r.batch, serve: r.serve, fresh: flag(r.fresh), tips: r.tips, reheat: r.reheat }),
        id,
      ).toEqual(clean({ ...x, ing: undefined, steps: undefined }))
      expect(r.ing.map(ing), id).toEqual(x.ing.map(refIng))
      expect(r.steps.map(step), id).toEqual(x.steps)
    }
    expect(Object.keys(RECIPES).filter((id) => !(id in ref.R)).sort()).toEqual([...NEW_RECIPES].sort())
  })

  it('заготовки, кроме вторника и четверга', () => {
    for (const [id, s] of Object.entries(SESSIONS)) {
      if (REPLACED_SESSIONS.includes(id)) continue
      expect(
        clean({
          n: s.name, day: s.day, when: s.when, time: s.time, covers: s.covers, note: s.note,
          makes: s.makes.map((m) => clean({ r: m.recipe, n: m.n, keep: m.keep, freeze: flag(m.freeze) })),
          extra: s.extra?.map((e) => [e.id, e.q]),
          steps: s.steps.map(step),
        }),
        id,
      ).toEqual(ref.SESSIONS[id])
    }
  })
})

describe('замены по ТЗ', () => {
  it('КБЖУ и время новых блюд', () => {
    expect(RECIPES.stroganoff).toMatchObject({ k: 690, p: 34, f: 19, c: 92, time: 25, batch: 'stroganoff', serve: [] })
    expect(RECIPES.kebabmince).toMatchObject({ k: 690, p: 40, f: 15, c: 90, time: 25, batch: 'kebabmince', serve: ['lavash', 'plainYogurt', 'veg'] })
    expect(RECIPES.salmonPan).toMatchObject({ k: 700, p: 39, f: 16, c: 98, time: 25, fresh: true })
    expect(RECIPES.salmonPan.batch).toBeUndefined()
    expect(RECIPES.curry).toMatchObject({ k: 635, p: 40, f: 14, c: 88, time: 25, batch: 'curry', serve: [] })
  })
  it('ни одного шага с духовкой, ни одного таймера дольше 15 минут', () => {
    for (const id of NEW_RECIPES) {
      const r = RECIPES[id as keyof typeof RECIPES]
      for (const s of r.steps) {
        expect(s.text.toLowerCase(), id).not.toContain('духовк')
        expect(s.timer ?? 0, `${id}: ${s.text}`).toBeLessThanOrEqual(900)
      }
    }
  })
  it('заготовки вторника и четверга', () => {
    expect(SESSIONS.tue).toMatchObject({ name: 'Бефстроганов и фарш', day: 1, when: 'evening', time: 50, covers: 'на Ср–Пт', extra: [{ id: 'salmon', q: 60 }] })
    expect(SESSIONS.tue.makes).toEqual([
      { recipe: 'stroganoff', n: 2, keep: 3 },
      { recipe: 'kebabmince', n: 2, keep: 3 },
    ])
    expect(SESSIONS.thu).toMatchObject({ name: 'Курица карри', day: 3, when: 'evening', time: 30, covers: 'на Пт и Вс' })
    expect(SESSIONS.thu.makes).toEqual([{ recipe: 'curry', n: 2, keep: 3 }])
  })
})

describe('целостность данных', () => {
  it('все ингредиенты ссылаются на существующие продукты', () => {
    for (const r of Object.values(RECIPES)) for (const i of r.ing) expect(PRODUCTS[i.id], i.id).toBeDefined()
    for (const s of Object.values(SESSIONS)) for (const e of s.extra ?? []) expect(PRODUCTS[e.id], e.id).toBeDefined()
  })
  it('у каждого batch-рецепта есть заготовка', () => {
    const made = new Set(Object.values(SESSIONS).flatMap((s) => s.makes.map((m) => RECIPES[m.recipe].batch)))
    for (const r of Object.values(RECIPES)) if (r.batch) expect(made.has(r.batch), r.batch).toBe(true)
  })
  it('каждый продукт кому-то нужен', () => {
    const used = new Set<string>([
      ...Object.values(RECIPES).flatMap((r) => r.ing.map((i) => i.id)),
      ...Object.values(SESSIONS).flatMap((s) => (s.extra ?? []).map((e) => e.id)),
    ])
    const unused = Object.keys(PRODUCTS).filter((id) => !used.has(id))
    // Томатная паста была только в гуляше; это бакалея, её оставили в справочнике.
    expect(unused).toEqual(['tomatoPaste'])
  })
})
