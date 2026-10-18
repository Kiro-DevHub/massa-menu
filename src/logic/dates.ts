import type { Weekday } from '@/data'

/** Дата в формате YYYY-MM-DD по местному времени. */
export type ISODate = string

export const DW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const
export const DW_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'] as const
/** «до понедельника» */
export const DW_GEN = ['понедельника', 'вторника', 'среды', 'четверга', 'пятницы', 'субботы', 'воскресенья'] as const
/** «в понедельник» */
export const DW_ACC = ['в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу', 'в воскресенье'] as const
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'] as const

export const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (d: Date): ISODate => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export function parse(s: ISODate): Date {
  const [y = 1970, m = 1, d = 1] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function addDays(s: ISODate, n: number): ISODate {
  const d = parse(s)
  d.setDate(d.getDate() + n)
  return iso(d)
}
export const weekday = (s: ISODate) => ((parse(s).getDay() + 6) % 7) as Weekday
export const diffDays = (a: ISODate, b: ISODate) => Math.round((parse(b).getTime() - parse(a).getTime()) / 864e5)
export const todayISO = (now: Date = new Date()) => iso(now)
export const weekStart = (s: ISODate) => addDays(s, -weekday(s))
export const dayOfMonth = (s: ISODate) => parse(s).getDate()

/** «19 октября» */
export function dateLong(s: ISODate) {
  const d = parse(s)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}
/** «Пн 19.10» */
export function dateShort(s: ISODate) {
  const d = parse(s)
  return `${DW[weekday(s)]} ${pad(d.getDate())}.${pad(d.getMonth() + 1)}`
}
/** «19.10» */
export function dayMonth(s: ISODate) {
  const d = parse(s)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`
}
/** Для «до …»: «сегодня», «завтра», «среды», «Пн 26.10». */
export function untilDay(today: ISODate, s: ISODate) {
  const n = diffDays(today, s)
  if (n === 0) return 'сегодня'
  if (n === 1) return 'завтра'
  return n > 1 && n < 7 ? DW_GEN[weekday(s)] : dateShort(s)
}
/** «сегодня», «завтра», «вчера», «в среду», «Пн 26.10». */
export function relDay(today: ISODate, s: ISODate) {
  const n = diffDays(today, s)
  if (n === 0) return 'сегодня'
  if (n === 1) return 'завтра'
  if (n === -1) return 'вчера'
  return n > 1 && n < 7 ? DW_ACC[weekday(s)] : dateShort(s)
}
