import { describe, expect, it } from 'vitest'
import { makeBackup, parseBackup } from '../backup'
import { migrateDataV1toV2, migratePersistedV1 } from '../migrate'
import { dayEaten } from '../nutrition'
import { simulate } from '../simulate'
import { eatMeal, undoMeal } from '../stock'
import type { AppData } from '../types'
import { MON, TUE, WED, data } from './helpers'

const PREV_TUE = '2026-10-13'
const PREV_THU = '2026-10-15'

/**
 * Состояние, как его сохранила версия v1: старые ключи контейнеров, говядина и куриный фарш в кладовке,
 * отметки без снапшота. Типы v1 шире текущих, поэтому объект собран как сырой JSON.
 */
function v1State() {
  return {
    pantry: { eggs: 5, rice: 800, beef: 300, chickenMince: 200, pork: 120 },
    staples: { soy: 'low' },
    fridge: [
      { id: 'g1', key: 'goulash', cooked: '2026-10-18', until: '2026-10-21', n: 2, freeze: false },
      { id: 't1', key: 'teriyaki', cooked: '2026-10-18', until: '2026-10-21', n: 1, freeze: false },
      { id: 's1', key: 'syrniki', cooked: '2026-10-17', until: '2026-11-16', n: 1, freeze: true },
    ],
    log: {
      [PREV_TUE]: {
        slots: { s: { st: 'skipped' } },
        extras: [],
        sessions: { tue: { use: { pantry: { beef: 240, rice: 240, beefMince: 240 }, fridge: [] }, made: ['g0', 'l0'] } },
      },
      [PREV_THU]: {
        slots: {
          d: { st: 'eaten', from: 'fridge', use: { pantry: {}, fridge: [{ id: 'l0', key: 'lula', cooked: PREV_TUE, until: '2026-10-16', n: 1, freeze: false }] } },
          s: { st: 'eaten', from: 'fridge', use: { pantry: {}, fridge: [{ id: 'g0', key: 'goulash', cooked: PREV_TUE, until: '2026-10-16', n: 1, freeze: false }] } },
        },
        extras: [],
        sessions: {},
      },
      [MON]: {
        slots: {
          b: { st: 'eaten', from: 'fresh', use: { pantry: { eggs: 3 }, fridge: [] } },
          d: { st: 'eaten', from: 'fridge', use: { pantry: {}, fridge: [{ id: 't0', key: 'teriyaki', cooked: '2026-10-18', until: '2026-10-21', n: 1, freeze: false }] } },
        },
        extras: [{ id: 'x1', name: 'Кофе с сиропом', k: 180, p: 4, f: 6, c: 28 }],
        sessions: {},
      },
    },
    bought: [
      { id: 'b1', date: MON, prod: 'eggs', qty: 10 },
      { id: 'b2', date: MON, prod: 'beef', qty: 300 },
    ],
    weight: [
      { d: '2026-10-12', kg: 70.8 },
      { d: MON, kg: 71.4 },
    ],
  } as unknown as AppData
}

describe('миграция v1 → v2', () => {
  const before = v1State()
  const after = migrateDataV1toV2(before)

  it('не трогает исходный объект', () => {
    expect(before.fridge[0]!.key).toBe('goulash')
  })

  it('вес, бакалея, еда вне меню и покупки на месте', () => {
    expect(after.weight).toEqual(before.weight)
    expect(after.staples).toEqual({ soy: 'low' })
    expect(after.log[MON]!.extras).toEqual(before.log[MON]!.extras)
    expect(after.bought).toEqual([{ id: 'b1', date: MON, prod: 'eggs', qty: 10 }])
  })

  it('кладовка: всё на месте, кроме удалённых продуктов', () => {
    expect(after.pantry).toEqual({ eggs: 5, rice: 800, pork: 120 })
    expect(after.log[PREV_TUE]!.sessions.tue!.use.pantry).toEqual({ rice: 240, beefMince: 240 })
  })

  it('порции старых блюд становятся порциями новых, в том числе в копиях внутри лога', () => {
    expect(after.fridge.map((f) => [f.id, f.key, f.n])).toEqual([
      ['s1', 'syrniki', 1],
      ['g1', 'stroganoff', 2],
      ['t1', 'teriyaki', 1],
    ])
    const thu = after.log[PREV_THU]!.slots
    expect(thu.d?.st === 'eaten' && thu.d.use.fridge[0]!.key).toBe('kebabmince')
    expect(thu.s?.st === 'eaten' && thu.s.use.fridge[0]!.key).toBe('stroganoff')
  })

  it('прошлые отметки получают снапшот того, что было в меню v1', () => {
    expect(after.log[PREV_THU]!.slots.s!.meal).toEqual({ rid: 'goulash', name: 'Гуляш с рисом', k: 660, p: 32, f: 16, c: 96 })
    expect(after.log[PREV_THU]!.slots.d!.meal).toMatchObject({ rid: 'lula', k: 690 })
    expect(after.log[PREV_TUE]!.slots.s!.meal).toMatchObject({ rid: 'salmon', name: 'Горбуша в фольге с рисом' })
    expect(after.log[MON]!.slots.b!.meal).toMatchObject({ rid: 'omeletCheese', k: 670 })
  })

  it('КБЖУ прошлых дней не изменилось после смены меню', () => {
    // Чт по меню v1: люля 690/39/15/89 и гуляш 660/32/16/96.
    expect(dayEaten(after, PREV_THU)).toEqual({ k: 1350, p: 71, f: 31, c: 185 })
    // Сегодняшние отметки: омлет и терияки, плюс кофе вне меню.
    expect(dayEaten(after, MON)).toEqual({ k: 670 + 635 + 180, p: 34 + 39 + 4, f: 25 + 9 + 6, c: 74 + 98 + 28 })
  })

  it('«Съел» в среду берёт бывший гуляш из холодильника, отмена возвращает его же', () => {
    const d1 = eatMeal(after, WED, 's')
    const e = d1.log[WED]!.slots.s!
    expect(e.st === 'eaten' && e.from).toBe('fridge')
    expect(d1.fridge.find((f) => f.id === 'g1')!.n).toBe(1)
    expect(e.meal).toMatchObject({ rid: 'stroganoff', name: 'Бефстроганов из свинины с рисом' })
    expect(undoMeal(d1, WED, 's')).toEqual(after)
  })

  it('отмена старой отметки возвращает порцию существующего блюда', () => {
    const d1 = undoMeal(after, PREV_THU, 's')
    expect(d1.fridge.find((f) => f.id === 'g0')).toMatchObject({ key: 'stroganoff', n: 1 })
  })

  it('стор: настройки и таймеры не трогаются', () => {
    const timers = [{ id: 't', end: 1, total: 60, label: 'Рис', rang: false }]
    const s = migratePersistedV1({ data: before, settings: { theme: 'light' as const }, timers })
    expect(s.settings).toEqual({ theme: 'light' })
    expect(s.timers).toBe(timers)
    expect(s.data!.fridge.map((f) => f.key)).toEqual(['syrniki', 'stroganoff', 'teriyaki'])
  })

  it('бэкап версии 1 при импорте проходит ту же миграцию, порции не теряются', () => {
    const file = { ...makeBackup(before, { theme: 'auto' }), schema: 1 }
    const r = parseBackup(JSON.stringify(file))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.fridge.map((f) => f.key)).toEqual(['syrniki', 'stroganoff', 'teriyaki'])
    expect(r.data.log[PREV_THU]!.slots.s!.meal).toMatchObject({ rid: 'goulash', k: 660 })
    expect(r.data.pantry).toEqual({ eggs: 5, rice: 800, pork: 120 })
  })

  it('данные v2 повторная миграция не меняет', () => {
    expect(migrateDataV1toV2(after)).toEqual(after)
  })
})

describe('снапшот в логе', () => {
  it('«Съел» и «Не ел» сохраняют блюдо, название и КБЖУ', () => {
    const d1 = eatMeal(data(), TUE, 's')
    expect(d1.log[TUE]!.slots.s!.meal).toEqual({ rid: 'salmonPan', name: 'Горбуша на сковороде с рисом', k: 700, p: 39, f: 16, c: 98 })
  })
  it('история считается по снапшоту, а не по текущему меню', () => {
    const d1 = eatMeal(data(), TUE, 's')
    d1.log[TUE]!.slots.s!.meal = { rid: 'old', name: 'Старое блюдо', k: 500, p: 10, f: 10, c: 10 }
    expect(dayEaten(d1, TUE)).toEqual({ k: 500, p: 10, f: 10, c: 10 })
  })
})

describe('прогноз покупок на неделю после замены блюд', () => {
  // Пн–Вс с пустой кладовки и пустого холодильника, все заготовки по плану.
  const need = simulate({}, MON, '2026-10-26', {}, {}).need
  it('свинины, риса и сливок больше, томатного соуса меньше, куриный фарш не нужен', () => {
    expect(need.pork).toBe(380) // было 120: только вок
    expect(need.rice).toBe(1040) // было 880
    expect(need.cream).toBe(150) // было 50: только сливочная паста
    expect(need.tomatoSauce).toBe(400) // было 600: тефтели ушли
    expect(need.beefMince).toBe(720) // столько же: фарш по-восточному вместо люля
    expect(need.sourCream).toBe(80)
    expect('chickenMince' in need).toBe(false)
  })
})
