import { emptyData, type AppData, type FridgeItem } from '../types'

/** Неделя 19–25 октября 2026: понедельник … воскресенье. */
export const MON = '2026-10-19'
export const TUE = '2026-10-20'
export const WED = '2026-10-21'
export const THU = '2026-10-22'
export const FRI = '2026-10-23'
export const SAT = '2026-10-24'
export const SUN = '2026-10-25'
export const PREV_SUN = '2026-10-18'

export const seqIds = (prefix = 'id') => {
  let n = 0
  return () => `${prefix}${++n}`
}

export const data = (patch: Partial<AppData> = {}): AppData => ({ ...emptyData(), ...patch })

export const tub = (p: Partial<FridgeItem> & Pick<FridgeItem, 'id' | 'key'>): FridgeItem => ({
  cooked: PREV_SUN,
  until: '2026-10-21',
  n: 1,
  freeze: false,
  ...p,
})
