import { create } from 'zustand'
import type { ISODate } from '@/logic/dates'

/** Состояние интерфейса, которое не нужно хранить между запусками. */
interface UiState {
  /** Выбранный день на экране «Сегодня»; null — сегодняшний. */
  selectedDate: ISODate | null
  /** Направление последней смены дня, для анимации. */
  dayDir: 1 | -1
  stockTab: 'fridge' | 'pantry'
  /** Отмеченные шаги рецептов: ключ «r:id» или «s:id». */
  doneSteps: Record<string, Record<number, boolean>>
  selectDate: (d: ISODate | null, dir?: 1 | -1) => void
  setStockTab: (t: 'fridge' | 'pantry') => void
  toggleStep: (key: string, i: number) => void
}

export const useUi = create<UiState>()((set) => ({
  selectedDate: null,
  dayDir: 1,
  stockTab: 'fridge',
  doneSteps: {},
  selectDate: (d, dir) => set((s) => ({ selectedDate: d, dayDir: dir ?? s.dayDir })),
  setStockTab: (t) => set({ stockTab: t }),
  toggleStep: (key, i) =>
    set((s) => ({ doneSteps: { ...s.doneSteps, [key]: { ...s.doneSteps[key], [i]: !s.doneSteps[key]?.[i] } } })),
}))
