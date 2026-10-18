import { addDays, type ISODate } from './dates'
import type { AppData } from './types'

export const LOG_KEEP_DAYS = 60
export const BOUGHT_KEEP_DAYS = 14
export const WEIGHT_MAX = 400

/** Чистка истории: лог старше 60 дней, покупки старше 14 дней, вес не больше 400 записей. */
export function prune(data: AppData, today: ISODate): AppData {
  const lim = addDays(today, -LOG_KEEP_DAYS)
  const oldDays = Object.keys(data.log).filter((d) => d < lim)
  const bLim = addDays(today, -BOUGHT_KEEP_DAYS)
  const oldBought = data.bought.some((b) => b.date < bLim)
  if (!oldDays.length && !oldBought && data.weight.length <= WEIGHT_MAX) return data
  const log = { ...data.log }
  for (const d of oldDays) delete log[d]
  return {
    ...data,
    log,
    bought: data.bought.filter((b) => b.date >= bLim),
    weight: data.weight.length > WEIGHT_MAX ? data.weight.slice(-WEIGHT_MAX) : data.weight,
  }
}
