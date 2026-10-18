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

const clean = <T extends object>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined))

const step = (s: Step) => clean({ t: s.text, timer: s.timer, tl: s.timerLabel })
const ing = (i: Ingredient) => {
  const a: unknown[] = [i.id, i.q]
  if (i.note || i.pre) a.push(i.note ?? '')
  if (i.pre) a.push('pre')
  return a
}
const refIng = (a: unknown[]) => (a[2] === undefined || a.length > 2 ? a : a.slice(0, 2))
const flag = (v: unknown) => (v ? 1 : undefined)

describe('данные совпадают с прототипом 1-в-1', () => {
  it('категории, слоты, расписание, пресеты', () => {
    expect([...CATEGORIES]).toEqual(ref.CATS)
    expect(SLOTS.map((s) => ({ k: s.key, n: s.name, t: s.time }))).toEqual(ref.SLOTS)
    expect(MENU).toEqual(ref.MENU)
    expect(TRAIN_DAYS).toEqual(ref.TRAIN)
    expect(TRIP_DAYS).toEqual(ref.TRIP_DAYS)
    expect(SESSION_ORDER).toEqual(ref.SESSION_ORDER)
    expect(BATCH_NAMES).toEqual(ref.BATCH_NAME)
    expect(PRESETS.map((p) => ({ n: p.name, k: p.k, p: p.p, f: p.f, c: p.c }))).toEqual(ref.PRESETS)
  })

  it('продукты', () => {
    const ours = Object.fromEntries(
      Object.entries(PRODUCTS).map(([id, p]) => [
        id,
        clean({
          n: p.name,
          u: 'unit' in p ? p.unit : undefined,
          cat: p.cat,
          meat: flag('meat' in p && p.meat),
          staple: flag('staple' in p && p.staple),
          step: 'step' in p ? p.step : undefined,
          pack: 'pack' in p ? p.pack : undefined,
        }),
      ]),
    )
    expect(ours).toEqual(ref.P)
  })

  it('рецепты', () => {
    for (const [id, r] of Object.entries(RECIPES)) {
      const x = ref.R[id]
      expect(x, id).toBeDefined()
      const rr = r as (typeof RECIPES)[keyof typeof RECIPES] & Record<string, unknown>
      expect(
        clean({
          n: rr.name, kind: rr.kind, k: rr.k, p: rr.p, f: rr.f, c: rr.c, time: rr.time,
          batch: rr.batch, serve: rr.serve, fresh: flag(rr.fresh), tips: rr.tips, reheat: rr.reheat,
        }),
        id,
      ).toEqual(clean({ ...x, ing: undefined, steps: undefined }))
      expect(r.ing.map(ing), id).toEqual(x.ing.map(refIng))
      expect(r.steps.map(step), id).toEqual(x.steps)
    }
    expect(Object.keys(RECIPES)).toEqual(Object.keys(ref.R))
  })

  it('заготовки', () => {
    for (const [id, s] of Object.entries(SESSIONS)) {
      const x = ref.SESSIONS[id]
      const ss = s as (typeof SESSIONS)[keyof typeof SESSIONS] & Record<string, unknown>
      expect(
        clean({
          n: ss.name, day: ss.day, when: ss.when, time: ss.time, covers: ss.covers, note: ss.note,
          makes: ss.makes.map((m) => clean({ r: m.recipe, n: m.n, keep: m.keep, freeze: flag((m as { freeze?: true }).freeze) })),
          extra: (ss.extra as { id: string; q: number }[] | undefined)?.map((e) => [e.id, e.q]),
          steps: ss.steps.map(step),
        }),
        id,
      ).toEqual(x)
    }
    expect(Object.keys(SESSIONS).sort()).toEqual(Object.keys(ref.SESSIONS).sort())
  })
})

describe('целостность данных', () => {
  it('все ингредиенты ссылаются на существующие продукты', () => {
    for (const r of Object.values(RECIPES)) for (const i of r.ing) expect(PRODUCTS[i.id], i.id).toBeDefined()
  })
  it('у каждого batch-рецепта есть заготовка', () => {
    const made = new Set(Object.values(SESSIONS).flatMap((s) => s.makes.map((m) => RECIPES[m.recipe].batch)))
    for (const r of Object.values(RECIPES)) if ('batch' in r && r.batch) expect(made.has(r.batch), r.batch).toBe(true)
  })
})
