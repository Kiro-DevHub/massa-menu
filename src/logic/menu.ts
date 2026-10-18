import { MENU, RECIPES, SESSIONS, SESSION_ORDER, type Recipe, type RecipeId, type SessionId, type Slot } from '@/data'
import { type ISODate, weekday } from './dates'

export const recipeIdAt = (date: ISODate, slot: Slot): RecipeId => MENU[weekday(date)][slot]
export const recipeAt = (date: ISODate, slot: Slot): Recipe => RECIPES[recipeIdAt(date, slot)]
export const recipe = (id: RecipeId): Recipe => RECIPES[id]

/** Заготовки, запланированные на день недели этой даты. */
export const sessionsOn = (date: ISODate): SessionId[] => SESSION_ORDER.filter((id) => SESSIONS[id].day === weekday(date))
