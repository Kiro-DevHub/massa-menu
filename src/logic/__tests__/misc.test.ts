import { describe, expect, it } from 'vitest'
import { fmtDuration, fmtQ, mmss, plural } from '../format'
import { dayEaten, dayPlan, nextSlot, sessionNeeds } from '../nutrition'
import { prune } from '../prune'
import { addExtra, eatMeal, skipMeal } from '../stock'
import { weightAdvice, weightStats } from '../weight'
import { MON, TUE, data } from './helpers'

describe('форматирование', () => {
  it('fmtQ', () => {
    expect(fmtQ(1500, 'г')).toBe('1,5 кг')
    expect(fmtQ(250, 'мл')).toBe('250 мл')
    expect(fmtQ(1000, 'мл')).toBe('1 л')
    expect(fmtQ(2.5, 'шт')).toBe('2½ шт')
    expect(fmtQ(0.5, 'шт')).toBe('½ шт')
    expect(fmtQ(12.34, 'г')).toBe('12,3 г')
  })
  it('mmss и длительность', () => {
    expect(mmss(240)).toBe('4:00')
    expect(mmss(5400)).toBe('1:30:00')
    expect(mmss(-3)).toBe('0:00')
    expect(fmtDuration(100)).toBe('1 ч 40 мин')
  })
  it('plural', () => {
    expect(plural(1, ['день', 'дня', 'дней'])).toBe('день')
    expect(plural(3, ['день', 'дня', 'дней'])).toBe('дня')
    expect(plural(11, ['день', 'дня', 'дней'])).toBe('дней')
  })
})

describe('КБЖУ дня', () => {
  it('план понедельника', () => {
    expect(dayPlan(MON)).toEqual({ k: 2640, p: 151, f: 67, c: 355 })
  })
  it('съеденное и еда вне меню', () => {
    let d = eatMeal(data(), MON, 'b')
    d = skipMeal(d, MON, 'l')
    d = addExtra(d, MON, { name: 'Бургер', k: 550, p: 28, f: 28, c: 45 })
    expect(dayEaten(d, MON)).toEqual({ k: 1220, p: 62, f: 53, c: 119 })
  })
  it('ближайший неотмеченный приём', () => {
    const d = skipMeal(eatMeal(data(), MON, 'b'), MON, 'l')
    expect(nextSlot(d, MON, MON)).toBe('d')
    expect(nextSlot(d, MON, TUE)).toBeNull()
  })
})

describe('заготовка: понадобится', () => {
  it('сумма batch-ингредиентов и extra', () => {
    const n = Object.fromEntries(sessionNeeds('tue').map((x) => [x.id, x.q]))
    expect(n).toMatchObject({ pork: 260, rice: 220, sourCream: 80, beefMince: 240, bulgur: 200, salmon: 60 })
    expect(n.lavash).toBeUndefined() // подаётся свежим
  })
})

describe('вес', () => {
  it('совет на границах', () => {
    expect(weightAdvice(null)).toBe('none')
    expect(weightAdvice(0.24)).toBe('slow')
    expect(weightAdvice(0.25)).toBe('ok')
    expect(weightAdvice(1.4)).toBe('ok')
    expect(weightAdvice(1.41)).toBe('fast')
  })
  it('среднее за 7 дней против среднего 14 дней назад', () => {
    const w = [
      { d: '2026-10-01', kg: 70 },
      { d: '2026-10-04', kg: 70.4 },
      { d: '2026-10-15', kg: 71 },
      { d: '2026-10-18', kg: 71.4 },
    ]
    const s = weightStats(w, '2026-10-18')
    expect(s.cur).toBeCloseTo(71.2)
    expect(s.prev).toBeCloseTo(70.2)
    expect(s.delta).toBeCloseTo(1)
  })
  it('нет данных двухнедельной давности — нет сравнения', () => {
    expect(weightStats([{ d: MON, kg: 70 }], MON).delta).toBeNull()
  })
})

describe('чистка истории', () => {
  it('лог старше 60 дней удаляется, ровно 60 — остаётся', () => {
    let d = skipMeal(data(), '2026-08-19', 'b') // MON − 61
    d = skipMeal(d, '2026-08-20', 'b') // MON − 60
    d = skipMeal(d, MON, 'b')
    expect(Object.keys(prune(d, MON).log).sort()).toEqual(['2026-08-20', MON])
  })
  it('ничего не меняется — возвращается тот же объект', () => {
    const d = skipMeal(data(), MON, 'b')
    expect(prune(d, MON)).toBe(d)
  })
})
