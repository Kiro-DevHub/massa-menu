import { addDays } from '../src/logic/dates'
import { addExtra, buy, doSession, eatMeal, setWeight, toggleStaple } from '../src/logic/stock'
import { emptyData, type AppData } from '../src/logic/types'

/** Понедельник 19.10.2026, обед: воскресная заготовка сделана, завтрак и ланч съедены. */
export const NOW = new Date('2026-10-19T12:30:00+03:00')
export const TODAY = '2026-10-19'

let n = 0
const ids = () => `fx${++n}`

export function midweek(): AppData {
  let d = emptyData()
  d.pantry = {
    chicken: 520, beefMince: 240, rice: 1400, pasta: 380, bulgur: 450, eggs: 9, cheese: 160, milk: 1200,
    bread: 380, lavash: 120, cottage: 200, banana: 5, apple: 3, juice: 900, cookies: 150, nuts: 110,
    protein: 640, tomatoSauce: 600, yogurtDrink: 2, veg: 400, creamCheese: 140, salmon: 300,
  }
  d = doSession(d, 'sun', addDays(TODAY, -1), ids)
  // Контейнер с прошлой недели, который пора выбросить.
  d.fridge.push({ id: 'old1', key: 'stroganoff', cooked: '2026-10-14', until: '2026-10-17', n: 1, freeze: false })
  d = eatMeal(d, TODAY, 'b')
  d = eatMeal(d, TODAY, 'l')
  d = eatMeal(d, addDays(TODAY, -1), 'b')
  d = eatMeal(d, addDays(TODAY, -1), 'd')
  d = addExtra(d, TODAY, { name: 'Кофе с сиропом', k: 180, p: 4, f: 6, c: 28 }, ids)
  d = toggleStaple(d, 'soy')
  d = buy(d, 'pork', 300, TODAY, ids)
  const base = [70.2, 70.5, 70.1, 70.6, 70.4, 70.8, 70.7, 71.0, 70.8, 71.2, 71.1, 71.4]
  base.forEach((kg, i) => {
    d = setWeight(d, addDays(TODAY, -33 + i * 3), kg)
  })
  return d
}

/** Состояние для localStorage-ключа zustand persist (лежит в IndexedDB как JSON-строка). */
export const persisted = (data: AppData, theme: 'light' | 'dark', timers: unknown[] = []) =>
  JSON.stringify({ state: { data, settings: { theme, lastBackup: '2026-10-12T10:00:00.000Z' }, timers }, version: 2 })
