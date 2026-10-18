// Перенесено 1-в-1 из reference/menu-reference.html. Паритет проверяет src/data/data-parity.test.ts.
import type { DayMenu, SlotInfo } from './types'

export const SLOTS = [
  { key: "b", name: "Завтрак", time: "08:00" },
  { key: "l", name: "Ланч", time: "11:00" },
  { key: "d", name: "Обед", time: "14:00" },
  { key: "p", name: "Полдник", time: "17:00" },
  { key: "s", name: "Ужин", time: "20:00" },
] as const satisfies readonly SlotInfo[]

/** Меню по дням недели, 0 = понедельник. */
export const MENU = [
  { b: "omeletCheese", l: "snMon", d: "teriyaki", p: "shake", s: "bolognese" },
  { b: "roll", l: "snTue", d: "teriyaki", p: "shake", s: "salmon" },
  { b: "syrnikiCond", l: "snWed", d: "bolognese", p: "shake", s: "goulash" },
  { b: "toastSalmon", l: "snThu", d: "lula", p: "shake", s: "goulash" },
  { b: "french", l: "snFri", d: "lula", p: "shake", s: "meatballs" },
  { b: "syrnikiNut", l: "snSat", d: "creamy", p: "shake", s: "shawarma" },
  { b: "omeletHam", l: "snSun", d: "meatballs", p: "shake", s: "wok" },
] as const satisfies readonly DayMenu[]
