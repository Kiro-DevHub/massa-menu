import { useEffect, useState, useSyncExternalStore } from 'react'
import { todayISO, type ISODate } from '@/logic/dates'
import { useAppStore } from './app-store'

/** true, когда данные подтянулись из IndexedDB. */
export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useAppStore.persist.onFinishHydration(cb),
    () => useAppStore.persist.hasHydrated(),
    () => false,
  )
}

/** Сегодняшняя дата; обновляется после полуночи и при возврате в приложение. */
export function useToday(): ISODate {
  const [today, setToday] = useState(todayISO)
  useEffect(() => {
    const tick = () => setToday((t) => (t === todayISO() ? t : todayISO()))
    const id = window.setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return today
}

/** Текущее время с шагом interval, только пока active. */
export function useNow(active: boolean, interval = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), interval)
    return () => window.clearInterval(id)
  }, [active, interval])
  return now
}
