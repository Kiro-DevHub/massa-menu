import { expect, test, type Page } from '@playwright/test'
import { NOW, midweek, persisted } from './fixture'

// Замена четырёх блюд: миграция данных v1 в настоящем браузере и скриншоты затронутых экранов.

async function seed(page: Page, value: string) {
  await page.goto('./')
  await page.evaluate(async (v) => {
    await new Promise<void>((res, rej) => {
      const req = indexedDB.open('keyval-store')
      req.onupgradeneeded = () => req.result.createObjectStore('keyval')
      req.onsuccess = () => {
        const tx = req.result.transaction('keyval', 'readwrite')
        tx.objectStore('keyval').put(v, 'massa-menu')
        tx.oncomplete = () => res()
        tx.onerror = () => rej(tx.error)
      }
    })
  }, value)
  await page.reload()
  await page.waitForSelector('nav[aria-label="Разделы"]')
}

async function open(page: Page, hash: string) {
  await page.goto(`./#${hash}`)
  await page.waitForSelector('nav[aria-label="Разделы"]')
  await page.waitForTimeout(450)
}

/** Кадр сверху и, если экран длинный, кадр с конца. */
async function shoot(page: Page, path: string) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `${path}.png` })
  const long = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight * 1.15)
  if (!long) return
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(250)
  await page.screenshot({ path: `${path}-end.png` })
}

test('данные версии 1 из IndexedDB открываются после обновления без потерь', async ({ page }) => {
  await page.clock.install({ time: NOW })
  const v1 = {
    state: {
      data: {
        pantry: { eggs: 5, beef: 300, chickenMince: 200 },
        staples: { soy: 'low' },
        fridge: [{ id: 'g1', key: 'goulash', cooked: '2026-10-18', until: '2026-10-21', n: 2, freeze: false }],
        log: { '2026-10-19': { slots: { b: { st: 'eaten', from: 'fresh', use: { pantry: { eggs: 3 }, fridge: [] } } }, extras: [], sessions: {} } },
        bought: [{ id: 'b1', date: '2026-10-19', prod: 'beef', qty: 300 }],
        weight: [{ d: '2026-10-19', kg: 71.4 }],
      },
      settings: { theme: 'light' },
      timers: [],
    },
    version: 1,
  }
  await seed(page, JSON.stringify(v1))

  // Сегодняшний завтрак по-прежнему отмечен.
  await expect(page.getByText('Омлет с сыром и тостами')).toBeVisible()
  await expect(page.getByText('670 ккал').first()).toBeVisible()

  // Бывший гуляш стал бефстрогановом и лежит в холодильнике.
  await open(page, '/stock')
  await expect(page.getByText('Бефстроганов', { exact: true })).toBeVisible()

  // Вес на месте.
  await open(page, '/weight')
  await expect(page.getByText('71,4 кг')).toBeVisible()

  // В хранилище записана уже новая версия.
  const stored = await page.evaluate(
    () =>
      new Promise<string>((res) => {
        const req = indexedDB.open('keyval-store')
        req.onsuccess = () => {
          const get = req.result.transaction('keyval').objectStore('keyval').get('massa-menu')
          get.onsuccess = () => res(get.result as string)
        }
      }),
  )
  const s = JSON.parse(stored)
  expect(s.version).toBe(2)
  expect(s.state.data.fridge[0].key).toBe('stroganoff')
  expect(s.state.data.pantry).toEqual({ eggs: 5 })
  expect(s.state.data.log['2026-10-19'].slots.b.meal.rid).toBe('omeletCheese')
})

for (const theme of ['light', 'dark'] as const) {
  test(`скриншоты новых блюд, ${theme}`, async ({ page }) => {
    await page.clock.install({ time: NOW })
    await seed(page, persisted(midweek(), theme))
    const dir = `screenshots/menu-update/${theme}`
    for (const [day, label] of [
      ['Вт', 'tue'],
      ['Ср', 'wed'],
      ['Чт', 'thu'],
      ['Пт', 'fri'],
    ] as const) {
      await open(page, '/')
      await page.getByRole('tab', { name: new RegExp(`^${day}`) }).click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${dir}/today-${label}.png`, fullPage: true })
    }
    for (const [name, hash] of [
      ['recipe-salmon', '/recipe/2026-10-20/s'],
      ['recipe-stroganoff', '/recipe/2026-10-21/s'],
      ['recipe-kebabmince', '/recipe/2026-10-22/d'],
      ['recipe-curry', '/recipe/2026-10-23/s'],
      ['prep', '/prep'],
      ['session-tue', '/prep/tue'],
      ['session-thu', '/prep/thu'],
      ['shop', '/shop'],
    ] as const) {
      await open(page, hash)
      await shoot(page, `${dir}/${name}`)
    }
  })
}
