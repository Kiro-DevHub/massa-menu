import { describe, expect, it } from 'vitest'
import { backupSummary, makeBackup, parseBackup } from '../backup'
import { doSession, eatMeal, setWeight } from '../stock'
import { MON, PREV_SUN, data, seqIds } from './helpers'

describe('бэкап', () => {
  it('экспорт → импорт возвращает те же данные и настройки', () => {
    let d = doSession(data({ pantry: { chicken: 1000, rice: 1000, beefMince: 500, tomatoSauce: 500 } }), 'sun', PREV_SUN, seqIds())
    d = eatMeal(d, MON, 'd')
    d = setWeight(d, MON, 72.4)
    const r = parseBackup(JSON.stringify(makeBackup(d, { theme: 'dark' })))
    expect(r).toMatchObject({ ok: true, source: 'app', settings: { theme: 'dark' } })
    expect(r.ok && r.data).toEqual(d)
  })

  it('импорт из прототипа (localStorage massa-menu-v1)', () => {
    const proto = {
      v: 1,
      updatedAt: 1,
      pantry: { eggs: 6, unknownThing: 5 },
      staples: { soy: 'low' },
      fridge: [{ id: 'a', key: 'syrniki', cooked: '2026-10-10', until: '2026-11-09', n: 2, freeze: 1 }],
      log: { [MON]: { slots: { b: { st: 'skipped' } }, extras: [{ id: 'x', n: 'Бургер', k: 550, p: 28, f: 28, c: 45 }], sessions: {} } },
      bought: [],
      weight: [{ d: MON, kg: 71.2 }],
    }
    const r = parseBackup(JSON.stringify(proto))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.source).toBe('prototype')
    expect(r.data.pantry).toEqual({ eggs: 6 })
    expect(r.data.staples).toEqual({ soy: 'low' })
    expect(r.data.fridge[0]!.freeze).toBe(true)
    expect(r.data.log[MON]!.extras[0]!.name).toBe('Бургер')
    expect(backupSummary(r.data)).toEqual({ days: 1, fridge: 2, pantry: 1, weight: 1 })
  })

  it('понятные ошибки', () => {
    expect(parseBackup('не json')).toMatchObject({ ok: false })
    expect(parseBackup('{"hello":1}')).toMatchObject({ ok: false, error: expect.stringContaining('не похож') })
    expect(parseBackup(JSON.stringify({ app: 'massa-menu', schema: 99, data: {} }))).toMatchObject({ ok: false, error: expect.stringContaining('новой версии') })
  })
})
