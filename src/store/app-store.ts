import { del, get, set as idbSet } from 'idb-keyval'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { ProductId, SessionId, Slot } from '@/data'
import { defaultSettings, SCHEMA_VERSION, type Settings, type Theme } from '@/logic/backup'
import { todayISO, type ISODate } from '@/logic/dates'
import { prune } from '@/logic/prune'
import * as stock from '@/logic/stock'
import { emptyData, uid, type AppData, type Extra } from '@/logic/types'

export interface Timer {
  id: string
  /** Время окончания, мс с эпохи: так таймер переживает перезагрузку. */
  end: number
  /** Исходная длительность, секунды. */
  total: number
  label: string
  rang: boolean
}

interface AppState {
  data: AppData
  settings: Settings
  timers: Timer[]

  eat: (date: ISODate, slot: Slot) => void
  skip: (date: ISODate, slot: Slot) => void
  undoMeal: (date: ISODate, slot: Slot) => void
  doSession: (sid: SessionId) => void
  undoSession: (date: ISODate, sid: SessionId) => void
  adjustFridge: (id: string, delta: number) => void
  setPantry: (id: ProductId, q: number) => void
  toggleStaple: (id: ProductId) => void
  stapleBought: (id: ProductId) => void
  buy: (id: ProductId, qty: number) => void
  unbuy: (purchaseId: string) => void
  addExtra: (date: ISODate, extra: Omit<Extra, 'id'>) => void
  removeExtra: (date: ISODate, id: string) => void
  setWeight: (kg: number) => void
  removeWeight: (date: ISODate) => void
  replaceAll: (data: AppData, settings?: Settings | null) => void
  resetAll: () => void
  setTheme: (theme: Theme) => void

  startTimer: (sec: number, label: string) => void
  stopTimer: (id: string) => void
  addMinute: (id: string) => void
  markRang: (id: string) => void
}

const idbStorage: StateStorage = {
  getItem: async (name) => (await get<string>(name)) ?? null,
  setItem: (name, value) => idbSet(name, value),
  removeItem: (name) => del(name),
}

type Persisted = Pick<AppState, 'data' | 'settings' | 'timers'>

/** Миграции схемы: ключ — версия, из которой мигрируем. Пока схема одна. */
const MIGRATIONS: Record<number, (s: Persisted) => Persisted> = {}

export const STORAGE_KEY = 'massa-menu'

export const useAppStore = create<AppState>()(
  persist(
    (set) => {
      const commit = (fn: (d: AppData, today: ISODate) => AppData) =>
        set((s) => {
          const today = todayISO()
          const next = prune(fn(s.data, today), today)
          return next === s.data ? s : { data: next }
        })
      return {
        data: emptyData(),
        settings: defaultSettings(),
        timers: [],

        eat: (date, slot) => commit((d) => stock.eatMeal(d, date, slot)),
        skip: (date, slot) => commit((d) => stock.skipMeal(d, date, slot)),
        undoMeal: (date, slot) => commit((d) => stock.undoMeal(d, date, slot)),
        doSession: (sid) => commit((d, t) => stock.doSession(d, sid, t)),
        undoSession: (date, sid) => commit((d) => stock.undoSession(d, date, sid)),
        adjustFridge: (id, delta) => commit((d) => stock.adjustFridge(d, id, delta)),
        setPantry: (id, q) => commit((d) => stock.setPantry(d, id, q)),
        toggleStaple: (id) => commit((d) => stock.toggleStaple(d, id)),
        stapleBought: (id) => commit((d) => stock.stapleBought(d, id)),
        buy: (id, qty) => commit((d, t) => stock.buy(d, id, qty, t)),
        unbuy: (pid) => commit((d) => stock.unbuy(d, pid)),
        addExtra: (date, x) => commit((d) => stock.addExtra(d, date, x)),
        removeExtra: (date, id) => commit((d) => stock.removeExtra(d, date, id)),
        setWeight: (kg) => commit((d, t) => stock.setWeight(d, t, kg)),
        removeWeight: (date) => commit((d) => stock.removeWeight(d, date)),
        replaceAll: (data, settings) => set((s) => ({ data: prune(data, todayISO()), settings: settings ?? s.settings })),
        resetAll: () => set({ data: emptyData(), timers: [] }),
        setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),

        startTimer: (sec, label) =>
          set((s) => ({ timers: [...s.timers, { id: uid(), end: Date.now() + sec * 1000, total: sec, label, rang: false }] })),
        stopTimer: (id) => set((s) => ({ timers: s.timers.filter((t) => t.id !== id) })),
        addMinute: (id) =>
          set((s) => ({
            timers: s.timers.map((t) => (t.id === id ? { ...t, end: Math.max(t.end, Date.now()) + 60_000, total: t.total + 60, rang: false } : t)),
          })),
        markRang: (id) => set((s) => ({ timers: s.timers.map((t) => (t.id === id ? { ...t, rang: true } : t)) })),
      }
    },
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => idbStorage),
      version: SCHEMA_VERSION,
      partialize: (s): Persisted => ({ data: s.data, settings: s.settings, timers: s.timers }),
      migrate: (persisted, version) => {
        let s = persisted as Persisted
        for (let v = version; v < SCHEMA_VERSION; v++) s = MIGRATIONS[v]?.(s) ?? s
        return s
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Persisted>
        return {
          ...current,
          data: p.data ? prune({ ...emptyData(), ...p.data }, todayISO()) : current.data,
          settings: { ...current.settings, ...p.settings },
          timers: p.timers ?? [],
        }
      },
    },
  ),
)

/** Просим браузер не вытеснять хранилище (на iOS помогает не всегда, поэтому есть бэкап). */
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) await navigator.storage.persist?.()
  } catch {
    /* не поддерживается */
  }
}
