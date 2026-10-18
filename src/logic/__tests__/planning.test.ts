import { describe, expect, it } from 'vitest'
import { dayReminders } from '../reminders'
import { nextTrip, pantryForecast, roundBuy, shopFreezerHint, shopping, shoppingCount } from '../shopping'
import { sessionDoneAt } from '../simulate'
import { mealSource } from '../sources'
import { buy, doSession, toggleStaple } from '../stock'
import type { AppData } from '../types'
import { FRI, MON, PREV_SUN, SAT, SUN, THU, TUE, WED, data, seqIds, tub } from './helpers'

const markSession = (d: AppData, date: string, sid: 'sun' | 'tue' | 'thu' | 'sat') => doSession(d, sid, date, seqIds(sid))

describe('окно «заготовка сделана»: от даты −2 до даты +1', () => {
  // Плановая дата заготовки «Тефтели» — четверг 22.10.
  const at = (date: string) => sessionDoneAt(markSession(data(), date, 'thu').log, 'thu', THU)
  it('−3 дня — не считается', () => expect(at('2026-10-19')).toBeNull())
  it('−2 дня — считается', () => expect(at('2026-10-20')).toBe('2026-10-20'))
  it('в день — считается', () => expect(at(THU)).toBe(THU))
  it('+1 день — считается', () => expect(at('2026-10-23')).toBe('2026-10-23'))
  it('+2 дня — не считается', () => expect(at('2026-10-24')).toBeNull())
})

describe('закупки', () => {
  it('ближайшая закупка — среда или воскресенье', () => {
    expect(nextTrip(MON)).toBe(WED)
    expect(nextTrip(WED)).toBe(WED)
    expect(nextTrip(THU)).toBe(SUN)
  })

  it('округление до упаковки или шага', () => {
    expect(roundBuy('eggs', 6)).toBe(10)
    expect(roundBuy('chicken', 260)).toBe(300)
    expect(roundBuy('veg', 150)).toBe(200)
    expect(roundBuy('banana', 2.5)).toBe(3)
    expect(roundBuy('rice', 900)).toBe(900)
  })

  it('пустая кладовка: всё в дефиците, два блока', () => {
    const sh = shopping(data(), MON)
    expect(sh.trip).toBe(WED)
    expect(sh.after).toBe(SUN)
    // До среды: Пн омлет 3 + Вт ролл 2.
    expect(sh.urgentDef.eggs).toBe(5)
    // Пн и Вт обед терияки свежим (холодильник пуст).
    expect(sh.urgentDef.chicken).toBe(260)
    // Пн ужин болоньезе свежим 120 + вечерняя заготовка вторника, люля 2 × 120.
    expect(sh.urgentDef.beefMince).toBe(360)
    // Ср–Сб: сырники 1, тосты 1, гренки 2, заготовка сырников 2.
    expect(sh.tripDef.eggs).toBe(6)
    // Бакалея в дефицит не попадает.
    expect(sh.urgentDef.spices).toBeUndefined()
  })

  it('после «Купил» дефицит пересчитывается с учётом остатка', () => {
    const d1 = buy(data(), 'eggs', 10, MON)
    const sh = shopping(d1, MON)
    expect(sh.urgentDef.eggs).toBeUndefined()
    expect(sh.tripDef.eggs).toBe(1) // осталось 5, на Ср–Сб нужно 6
  })

  it('в день закупки срочного блока нет', () => {
    const sh = shopping(data(), SUN)
    expect(sh.trip).toBe(SUN)
    expect(sh.urgentDef).toEqual({})
  })

  it('отмеченная заранее заготовка не попадает в прогноз', () => {
    const before = shopping(data(), MON).urgentDef.beefMince
    // Заготовку вторника отметили в понедельник (окно −2…+1).
    const d1 = markSession(data({ pantry: { beefMince: 500, beef: 500, rice: 500, bulgur: 500, salmon: 100 } }), MON, 'tue')
    expect(before).toBe(360)
    expect(shopping(d1, MON).urgentDef.beefMince).toBeUndefined()
  })

  it('бакалея «заканчивается» попадает в покупки и в бейдж', () => {
    const d1 = toggleStaple(data(), 'soy')
    const sh = shopping(d1, MON)
    expect(sh.lowStaples).toEqual(['soy'])
    expect(shoppingCount(sh)).toBe(Object.keys(sh.urgentDef).length + Object.keys(sh.tripDef).length + 1)
  })
})

describe('морозилка', () => {
  it('мясо дома, первое использование через ≥ 2 дня — «в морозилку»', () => {
    const f = pantryForecast(data({ pantry: { chicken: 1000 } }), WED)
    expect(f.freezer.chicken).toBe(SAT) // курица нужна в субботу
  })
  it('мясо, нужное завтра, не убираем в морозилку', () => {
    const f = pantryForecast(data({ pantry: { chicken: 1000 } }), FRI)
    expect(f.freezer.chicken).toBeUndefined()
  })
  it('накануне использования — «вечером переложи из морозилки»', () => {
    const r = dayReminders(data({ pantry: { chicken: 1000 } }), FRI, FRI)
    expect(r.find((x) => x.type === 'defrost')).toEqual({ type: 'defrost', items: [{ id: 'chicken', q: 250 }] })
  })
  it('свежекупленное мясо размораживать не нужно', () => {
    const d1 = buy(data(), 'chicken', 1000, THU)
    expect(dayReminders(d1, FRI, FRI).some((x) => x.type === 'defrost')).toBe(false)
  })
  it('в списке покупок: мясо на дальний день — «дома сразу в морозилку»', () => {
    const sh = shopping(data(), MON)
    expect(shopFreezerHint(sh, 'pork')).toBe(SUN) // вок в воскресенье, закупка в среду
    expect(shopFreezerHint(sh, 'chicken')).toBeNull() // нужна сегодня
    expect(shopFreezerHint(sh, 'rice')).toBeNull() // не мясо
  })
})

describe('откуда блюдо', () => {
  it('пустой холодильник: блюдо из заготовки — готовь свежим', () => {
    expect(mealSource(data(), MON, MON, 'd')).toEqual({ kind: 'missing' })
  })
  it('порция есть в холодильнике', () => {
    const d = data({ fridge: [tub({ id: 'a', key: 'teriyaki', n: 2 })] })
    expect(mealSource(d, MON, MON, 'd')).toEqual({ kind: 'fridge' })
    // Вторая порция — во вторник, третьей нет.
    expect(mealSource(d, MON, TUE, 'd')).toEqual({ kind: 'fridge' })
  })
  it('порцию съедят раньше — к этому приёму её уже не будет', () => {
    const d = data({ fridge: [tub({ id: 'a', key: 'teriyaki', n: 1 })] })
    expect(mealSource(d, MON, TUE, 'd')).toEqual({ kind: 'missing' })
  })
  it('из будущей заготовки', () => {
    expect(mealSource(data(), MON, WED, 's')).toEqual({ kind: 'fromSession', date: TUE }) // гуляш
    expect(mealSource(data(), MON, SAT, 'b')).toEqual({ kind: 'fromSession', date: SAT }) // сырники утром
  })
  it('сырники в морозилке', () => {
    const d = data({ fridge: [tub({ id: 's', key: 'syrniki', n: 1, freeze: true, until: '2026-11-20' })] })
    expect(mealSource(d, MON, WED, 'b')).toEqual({ kind: 'freezer' })
  })
  it('ланч, полдник, свежее блюдо', () => {
    expect(mealSource(data(), MON, MON, 'l')).toEqual({ kind: 'noCook' })
    expect(mealSource(data(), MON, MON, 'p')).toEqual({ kind: 'afterGym' })
    expect(mealSource(data(), MON, TUE, 'p')).toEqual({ kind: 'quick' })
    expect(mealSource(data(), MON, TUE, 's')).toEqual({ kind: 'fresh', minutes: 35 })
  })
  it('прошедший день без отметки', () => {
    expect(mealSource(data(), TUE, MON, 'd')).toEqual({ kind: 'past' })
  })
})

describe('напоминания', () => {
  it('заготовка сегодня, пока не отмечена', () => {
    expect(dayReminders(data(), SUN, SUN)).toContainEqual({ type: 'session', sid: 'sun', today: true })
    const done = markSession(data(), SUN, 'sun')
    expect(dayReminders(done, SUN, SUN).some((r) => r.type === 'session')).toBe(false)
  })
  it('пропущенная заготовка: сегодня блюда из неё, а в холодильнике пусто', () => {
    expect(dayReminders(data(), MON, MON)).toContainEqual({ type: 'missedSession', sid: 'sun' })
    const full = data({ fridge: [tub({ id: 'a', key: 'teriyaki', n: 2 }), tub({ id: 'b', key: 'bolognese', n: 2 })] })
    expect(dayReminders(full, MON, MON).some((r) => r.type === 'missedSession')).toBe(false)
  })
  it('просрочено и «съесть сегодня»; морозилка не просрочивается', () => {
    const d = data({
      fridge: [
        tub({ id: 'x', key: 'goulash', until: '2026-10-18' }),
        tub({ id: 'y', key: 'lula', until: MON }),
        tub({ id: 'z', key: 'syrniki', until: '2026-10-01', freeze: true }),
      ],
    })
    const r = dayReminders(d, MON, MON)
    expect(r.find((x) => x.type === 'expired')).toMatchObject({ items: [{ id: 'x' }] })
    expect(r.find((x) => x.type === 'eatToday')).toMatchObject({ items: [{ id: 'y' }] })
  })
  it('для другого дня — только плановая заготовка', () => {
    expect(dayReminders(data(), MON, PREV_SUN)).toEqual([{ type: 'session', sid: 'sun', today: false }])
  })
})
