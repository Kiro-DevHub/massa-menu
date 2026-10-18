// Перенесено 1-в-1 из reference/menu-reference.html. Паритет проверяет src/data/data-parity.test.ts.
import type { Weekday } from './types'

/** Дни зала (0 = понедельник). */
export const TRAIN_DAYS: readonly Weekday[] = [0, 2, 4]

/** Дни закупок: воскресенье и среда. */
export const TRIP_DAYS: readonly Weekday[] = [6, 2]
