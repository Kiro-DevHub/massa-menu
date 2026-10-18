import { BATCH_NAMES, PRODUCTS, SESSIONS, SLOTS, type BatchKey, type ProductId, type SessionId, type Slot } from '@/data'
import type { ISODate } from './dates'
import { sortFridge } from './stock'
import { emptyData, type AppData, type DayLog, type Extra, type FridgeItem, type SlotEntry, type Usage } from './types'

export type Theme = 'auto' | 'light' | 'dark'
export interface Settings {
  theme: Theme
  /** Когда последний раз сохраняли бэкап (ISO-время). */
  lastBackup?: string
}
export const defaultSettings = (): Settings => ({ theme: 'auto' })

export const BACKUP_APP = 'massa-menu'
export const SCHEMA_VERSION = 1

export interface BackupFile {
  app: typeof BACKUP_APP
  schema: number
  exportedAt: string
  data: AppData
  settings: Settings
}

export function makeBackup(data: AppData, settings: Settings, now: Date = new Date()): BackupFile {
  return { app: BACKUP_APP, schema: SCHEMA_VERSION, exportedAt: now.toISOString(), data, settings }
}

export const backupFileName = (today: ISODate) => `massa-menu-${today}.json`

/* ---------- валидация ---------- */

type Obj = Record<string, unknown>
const isObj = (x: unknown): x is Obj => !!x && typeof x === 'object' && !Array.isArray(x)
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const isISO = (x: unknown): x is ISODate => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)
const isProduct = (x: string): x is ProductId => x in PRODUCTS
const isBatch = (x: unknown): x is BatchKey => typeof x === 'string' && x in BATCH_NAMES
const isSession = (x: string): x is SessionId => x in SESSIONS
const SLOT_KEYS = SLOTS.map((s) => s.key) as string[]
const isSlot = (x: string): x is Slot => SLOT_KEYS.includes(x)

function qtyMap(x: unknown): Partial<Record<ProductId, number>> {
  const out: Partial<Record<ProductId, number>> = {}
  if (!isObj(x)) return out
  for (const [k, v] of Object.entries(x)) if (isProduct(k) && isNum(v) && v >= 0) out[k] = v
  return out
}

function fridgeItem(x: unknown): FridgeItem | null {
  if (!isObj(x) || typeof x.id !== 'string' || !isBatch(x.key) || !isISO(x.cooked) || !isISO(x.until) || !isNum(x.n)) return null
  return { id: x.id, key: x.key, cooked: x.cooked, until: x.until, n: x.n, freeze: !!x.freeze }
}

function usage(x: unknown): Usage {
  if (!isObj(x)) return { pantry: {}, fridge: [] }
  const fridge = Array.isArray(x.fridge) ? x.fridge.map(fridgeItem).filter((f): f is FridgeItem => !!f) : []
  return { pantry: qtyMap(x.pantry), fridge }
}

function extra(x: unknown): Extra | null {
  if (!isObj(x)) return null
  // В прототипе название лежало в поле n.
  const name = typeof x.name === 'string' ? x.name : typeof x.n === 'string' ? x.n : null
  if (!name || !isNum(x.k)) return null
  return { id: typeof x.id === 'string' ? x.id : Math.random().toString(36).slice(2, 10), name, k: x.k, p: isNum(x.p) ? x.p : 0, f: isNum(x.f) ? x.f : 0, c: isNum(x.c) ? x.c : 0 }
}

function dayLog(x: unknown): DayLog {
  const L: DayLog = { slots: {}, extras: [], sessions: {} }
  if (!isObj(x)) return L
  if (isObj(x.slots))
    for (const [k, v] of Object.entries(x.slots)) {
      if (!isSlot(k) || !isObj(v)) continue
      let e: SlotEntry | null = null
      if (v.st === 'skipped') e = { st: 'skipped' }
      else if (v.st === 'eaten') e = { st: 'eaten', use: usage(v.use), from: v.from === 'fridge' ? 'fridge' : 'fresh' }
      if (e) L.slots[k] = e
    }
  if (Array.isArray(x.extras)) L.extras = x.extras.map(extra).filter((e): e is Extra => !!e)
  if (isObj(x.sessions))
    for (const [k, v] of Object.entries(x.sessions)) {
      if (!isSession(k) || !isObj(v)) continue
      L.sessions[k] = { use: usage(v.use), made: Array.isArray(v.made) ? v.made.filter((m): m is string => typeof m === 'string') : [] }
    }
  return L
}

/** Приводит сырые данные (наш формат или прототип v1) к AppData, отбрасывая мусор. */
export function normalizeData(raw: Obj): AppData {
  const d = emptyData()
  d.pantry = qtyMap(raw.pantry)
  if (isObj(raw.staples)) for (const [k, v] of Object.entries(raw.staples)) if (isProduct(k) && v === 'low') d.staples[k] = 'low'
  if (Array.isArray(raw.fridge)) d.fridge = sortFridge(raw.fridge.map(fridgeItem).filter((f): f is FridgeItem => !!f && f.n > 0))
  if (isObj(raw.log)) for (const [k, v] of Object.entries(raw.log)) if (isISO(k)) d.log[k] = dayLog(v)
  if (Array.isArray(raw.bought))
    for (const b of raw.bought)
      if (isObj(b) && typeof b.id === 'string' && isISO(b.date) && typeof b.prod === 'string' && isProduct(b.prod) && isNum(b.qty))
        d.bought.push({ id: b.id, date: b.date, prod: b.prod, qty: b.qty })
  if (Array.isArray(raw.weight)) {
    for (const w of raw.weight) if (isObj(w) && isISO(w.d) && isNum(w.kg) && w.kg >= 30 && w.kg <= 200) d.weight.push({ d: w.d, kg: w.kg })
    d.weight.sort((a, b) => (a.d < b.d ? -1 : 1))
  }
  return d
}

export type ParsedBackup =
  | { ok: true; data: AppData; settings: Settings | null; source: 'app' | 'prototype'; exportedAt: string | null }
  | { ok: false; error: string }

/** Разбирает файл бэкапа: наш формат или localStorage прототипа (massa-menu-v1). */
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Это не JSON. Выбери файл, который сохранило приложение.' }
  }
  if (!isObj(raw)) return { ok: false, error: 'В файле нет данных приложения.' }
  if (raw.app === BACKUP_APP) {
    if (!isNum(raw.schema) || raw.schema > SCHEMA_VERSION)
      return { ok: false, error: 'Бэкап из более новой версии приложения. Обнови приложение и попробуй снова.' }
    if (!isObj(raw.data)) return { ok: false, error: 'В бэкапе нет данных.' }
    const theme = isObj(raw.settings) ? raw.settings.theme : undefined
    const settings: Settings | null = theme === 'auto' || theme === 'light' || theme === 'dark' ? { theme } : null
    return { ok: true, data: normalizeData(raw.data), settings, source: 'app', exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : null }
  }
  if (raw.v === 1 && ('pantry' in raw || 'log' in raw)) return { ok: true, data: normalizeData(raw), settings: null, source: 'prototype', exportedAt: null }
  return { ok: false, error: 'Файл не похож на бэкап «Меню на массу».' }
}

/** Короткая сводка для подтверждения импорта. */
export function backupSummary(d: AppData) {
  return {
    days: Object.keys(d.log).length,
    fridge: d.fridge.reduce((a, f) => a + f.n, 0),
    pantry: Object.values(d.pantry).filter((v) => (v ?? 0) > 0).length,
    weight: d.weight.length,
  }
}
