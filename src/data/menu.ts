// Перенесено 1-в-1 из reference/menu-reference.html, кроме четырёх заменённых блюд (без духовки и долгой готовки).
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
  { b: "roll", l: "snTue", d: "teriyaki", p: "shake", s: "salmonPan" },
  { b: "syrnikiCond", l: "snWed", d: "bolognese", p: "shake", s: "stroganoff" },
  { b: "toastSalmon", l: "snThu", d: "kebabmince", p: "shake", s: "stroganoff" },
  { b: "french", l: "snFri", d: "kebabmince", p: "shake", s: "curry" },
  { b: "syrnikiNut", l: "snSat", d: "creamy", p: "shake", s: "shawarma" },
  { b: "omeletHam", l: "snSun", d: "curry", p: "shake", s: "wok" },
] as const satisfies readonly DayMenu[]
