import type { Unit } from '@/data'
import { pad } from './dates'

const comma = (x: number) => x.toString().replace('.', ',')

/** Количество с единицей: «1,2 кг», «1½ шт», «250 мл». */
export function fmtQ(q: number, u?: Unit) {
  if (u === 'г' && q >= 1000) return comma(Math.round(q / 100) / 10) + ' кг'
  if (u === 'мл' && q >= 1000) return comma(Math.round(q / 100) / 10) + ' л'
  if (u === 'шт' && q % 1 !== 0) {
    const w = Math.floor(q)
    return (w ? w + '½' : '½') + ' шт'
  }
  return comma(Math.round(q * 10) / 10) + (u ? ' ' + u : '')
}

/** Секунды в «4:00» или «1:30:00». */
export function mmss(sec: number) {
  const s = Math.max(0, Math.ceil(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const x = s % 60
  return (h ? h + ':' + pad(m) : m) + ':' + pad(x)
}

/** Минуты в «35 мин», «1 ч 40 мин». */
export function fmtDuration(min: number) {
  if (min < 60) return `${min} мин`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} ч ${m} мин` : `${h} ч`
}

/** Килограммы с одной цифрой после запятой. */
export const fmtKg = (x: number) => x.toFixed(1).replace('.', ',')

/** Склонение: plural(3, ['день', 'дня', 'дней']). */
export function plural(n: number, forms: readonly [string, string, string]) {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return forms[2]
  if (b > 1 && b < 5) return forms[1]
  if (b === 1) return forms[0]
  return forms[2]
}

/** Парсинг числа из инпута с запятой. */
export const parseNum = (s: string) => parseFloat(String(s).replace(',', '.'))
