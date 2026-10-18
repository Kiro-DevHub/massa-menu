// Достаёт данные из прототипа reference/menu-reference.html как JS-объекты.
// Используется тестом паритета данных: src/data должен совпадать с прототипом 1-в-1.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const START = '/* ================= ДАННЫЕ ================= */'
const END = '/* ================= ДАТЫ ================= */'

export function loadReferenceData() {
  const file = fileURLToPath(new URL('../reference/menu-reference.html', import.meta.url))
  const html = readFileSync(file, 'utf8')
  const code = html.slice(html.indexOf(START), html.indexOf(END))
  const names = 'CATS,P,R,BATCH_NAME,SLOTS,MENU,TRAIN,TRIP_DAYS,SESSIONS,SESSION_ORDER,PRESETS'
  return new Function(`"use strict";${code};return {${names}};`)()
}
