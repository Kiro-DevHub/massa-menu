import { SESSIONS, SESSION_ORDER, type SessionId } from '@/data'
import { addDays, weekday, weekStart, type ISODate } from './dates'
import { sessionDoneAt } from './simulate'
import type { AppData } from './types'

export interface PrepStatus {
  sid: SessionId
  /** Дата, к которой относится статус: эта неделя, если уже сделано, иначе ближайшая. */
  planned: ISODate
  /** Когда отметили сделанной, если сделана. */
  doneAt: ISODate | null
  /** Дней до ближайшей плановой даты. */
  inDays: number
}

/** Статус заготовки: сделана ли на этой неделе, а если нет — когда ближайшая. */
export function prepStatus(data: AppData, today: ISODate, sid: SessionId): PrepStatus {
  const s = SESSIONS[sid]
  const thisWeek = addDays(weekStart(today), s.day)
  const doneThisWeek = sessionDoneAt(data.log, sid, thisWeek)
  const inDays = (s.day - weekday(today) + 7) % 7
  const next = addDays(today, inDays)
  if (doneThisWeek) return { sid, planned: thisWeek, doneAt: doneThisWeek, inDays }
  const doneNext = sessionDoneAt(data.log, sid, next)
  return { sid, planned: next, doneAt: doneNext, inDays }
}

/** Порядок карточек: сначала несделанные по близости, потом сделанные. */
export function prepOrder(data: AppData, today: ISODate): PrepStatus[] {
  return SESSION_ORDER.map((sid) => prepStatus(data, today, sid)).sort((a, b) => {
    if (!!a.doneAt !== !!b.doneAt) return a.doneAt ? 1 : -1
    return a.inDays - b.inDays
  })
}
