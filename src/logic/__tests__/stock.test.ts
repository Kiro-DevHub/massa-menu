import { describe, expect, it } from 'vitest'
import { weekday } from '../dates'
import { buy, doSession, eatMeal, rawFor, skipMeal, undoMeal, undoSession, unbuy } from '../stock'
import { MON, PREV_SUN, SAT, THU, TUE, data, seqIds, tub } from './helpers'

describe('даты в тестах', () => {
  it('19.10.2026 — понедельник', () => {
    expect(weekday(MON)).toBe(0)
    expect(weekday(PREV_SUN)).toBe(6)
  })
})

describe('rawFor', () => {
  it('serve — только то, что докладывается при подаче', () => {
    expect(rawFor('bolognese', 'serve').map((i) => i.id)).toEqual(['pasta', 'cheese'])
  })
  it('batch — всё, кроме serve', () => {
    expect(rawFor('bolognese', 'batch').map((i) => i.id)).toEqual(['beefMince', 'tomatoSauce', 'onion', 'oil', 'spices'])
  })
  it('pre не списывается ни в одном режиме', () => {
    for (const mode of ['full', 'serve', 'batch'] as const) expect(rawFor('toastSalmon', mode).some((i) => i.id === 'salmon')).toBe(false)
  })
})

describe('«Съел»', () => {
  const pantry = { pasta: 500, cheese: 100, beefMince: 1000, tomatoSauce: 500 }

  it('из холодильника: самая старая порция и только serve-ингредиенты', () => {
    const d0 = data({
      pantry: { ...pantry },
      fridge: [tub({ id: 'old', key: 'bolognese', cooked: '2026-10-17', n: 1 }), tub({ id: 'new', key: 'bolognese', cooked: PREV_SUN, n: 2 })],
    })
    const d1 = eatMeal(d0, MON, 's') // ужин понедельника — болоньезе
    expect(d1.fridge.map((f) => [f.id, f.n])).toEqual([['new', 2]])
    expect(d1.pantry).toEqual({ pasta: 380, cheese: 90, beefMince: 1000, tomatoSauce: 500 })
    const e = d1.log[MON]!.slots.s!
    expect(e.st === 'eaten' && e.from).toBe('fridge')
    expect(e.st === 'eaten' && e.use.fridge.map((f) => f.id)).toEqual(['old'])
  })

  it('без порции в холодильнике списывается весь рецепт, бакалея не считается', () => {
    const d1 = eatMeal(data({ pantry: { ...pantry } }), MON, 's')
    expect(d1.pantry).toEqual({ pasta: 380, cheese: 90, beefMince: 880, tomatoSauce: 400 })
    const e = d1.log[MON]!.slots.s!
    expect(e.st === 'eaten' && e.from).toBe('fresh')
    expect(e.st === 'eaten' && Object.keys(e.use.pantry).sort()).toEqual(['beefMince', 'cheese', 'pasta', 'tomatoSauce'])
  })

  it('если продукта не хватает, списывается сколько есть и запоминается именно это', () => {
    const d1 = eatMeal(data({ pantry: { pasta: 50 } }), MON, 's')
    expect(d1.pantry.pasta).toBe(0)
    const e = d1.log[MON]!.slots.s!
    expect(e.st === 'eaten' && e.use.pantry).toEqual({ pasta: 50 })
  })

  it('флаг pre: засоленная горбуша при еде не списывается', () => {
    const d0 = data({ pantry: { salmon: 200, bread: 500, creamCheese: 140, eggs: 10, veg: 500, juice: 1000 } })
    const d1 = eatMeal(d0, THU, 'b') // тосты с горбушей
    expect(d1.pantry).toEqual({ salmon: 200, bread: 400, creamCheese: 110, eggs: 9, veg: 450, juice: 750 })
  })

  it('отмена возвращает ровно то же: из холодильника', () => {
    const d0 = data({
      pantry: { ...pantry },
      fridge: [tub({ id: 'old', key: 'bolognese', cooked: '2026-10-17' }), tub({ id: 'new', key: 'bolognese', n: 2 })],
    })
    expect(undoMeal(eatMeal(d0, MON, 's'), MON, 's')).toEqual(d0)
  })

  it('отмена возвращает ровно то же: свежая готовка и неполная кладовка', () => {
    const d0 = data({ pantry: { pasta: 50, cheese: 100 } })
    expect(undoMeal(eatMeal(d0, MON, 's'), MON, 's')).toEqual(d0)
  })

  it('«Не ел» ничего не списывает и отменяется', () => {
    const d0 = data({ pantry: { ...pantry } })
    const d1 = skipMeal(d0, MON, 's')
    expect(d1.pantry).toEqual(d0.pantry)
    expect(d1.log[MON]!.slots.s).toMatchObject({ st: 'skipped', meal: { rid: 'bolognese', name: 'Паста болоньезе' } })
    expect(undoMeal(d1, MON, 's')).toEqual(d0)
  })

  it('отмена сохраняет остальные отметки дня', () => {
    const d1 = skipMeal(data({ pantry: { ...pantry } }), MON, 'b')
    const d2 = undoMeal(eatMeal(d1, MON, 's'), MON, 's')
    expect(d2).toEqual(d1)
  })
})

describe('«Заготовка сделана»', () => {
  const pantry = { chicken: 1000, rice: 2000, beefMince: 1000, tomatoSauce: 1000, pasta: 1000, cheese: 200 }

  it('воскресная: batch-ингредиенты × порции, контейнеры со сроком keep', () => {
    const d1 = doSession(data({ pantry: { ...pantry } }), 'sun', PREV_SUN, seqIds('t'))
    expect(d1.pantry).toEqual({ chicken: 740, rice: 1760, beefMince: 760, tomatoSauce: 800, pasta: 1000, cheese: 200 })
    expect(d1.fridge).toEqual([
      { id: 't1', key: 'teriyaki', cooked: PREV_SUN, until: '2026-10-21', n: 2, freeze: false },
      { id: 't2', key: 'bolognese', cooked: PREV_SUN, until: '2026-10-21', n: 2, freeze: false },
    ])
    expect(d1.log[PREV_SUN]!.sessions.sun!.made).toEqual(['t1', 't2'])
  })

  it('сырники уходят в морозилку на 30 дней', () => {
    const d1 = doSession(data({ pantry: { cottage: 400, eggs: 10 } }), 'sat', SAT, seqIds())
    expect(d1.fridge).toEqual([{ id: 'id1', key: 'syrniki', cooked: SAT, until: '2026-11-23', n: 2, freeze: true }])
    expect(d1.pantry).toEqual({ cottage: 0, eggs: 8 })
  })

  it('extra тоже списывается (горбуша на засолку во вторник)', () => {
    const d0 = data({ pantry: { salmon: 500, pork: 500, sourCream: 300, rice: 1000, beefMince: 500, bulgur: 500, lavash: 200, plainYogurt: 250, veg: 1000 } })
    const d1 = doSession(d0, 'tue', TUE, seqIds())
    expect(d1.pantry).toEqual({ salmon: 440, pork: 240, sourCream: 220, rice: 780, beefMince: 260, bulgur: 300, lavash: 200, plainYogurt: 250, veg: 1000 })
  })

  it('отмена заготовки возвращает ровно то же', () => {
    const d0 = data({ pantry: { ...pantry }, fridge: [tub({ id: 'x', key: 'stroganoff' })] })
    const d1 = doSession(d0, 'sun', PREV_SUN, seqIds())
    expect(undoSession(d1, PREV_SUN, 'sun')).toEqual(d0)
  })

  it('порция из заготовки съедается и возвращается в тот же контейнер', () => {
    const d1 = doSession(data({ pantry: { ...pantry } }), 'sun', PREV_SUN, seqIds())
    const d2 = eatMeal(d1, MON, 'd') // терияки
    expect(d2.fridge.find((f) => f.key === 'teriyaki')!.n).toBe(1)
    expect(d2.pantry).toEqual(d1.pantry) // у терияки serve пустой
    expect(undoMeal(d2, MON, 'd')).toEqual(d1)
  })
})

describe('покупки в кладовку', () => {
  it('«Купил» добавляет, отмена убирает ровно столько же', () => {
    const d0 = data({ pantry: { eggs: 3 } })
    const d1 = buy(d0, 'eggs', 10, MON, seqIds('b'))
    expect(d1.pantry.eggs).toBe(13)
    expect(d1.bought).toEqual([{ id: 'b1', date: MON, prod: 'eggs', qty: 10 }])
    expect(unbuy(d1, 'b1')).toEqual(d0)
  })
  it('нулевое количество игнорируется', () => {
    const d0 = data()
    expect(buy(d0, 'eggs', 0, MON)).toBe(d0)
  })
})
