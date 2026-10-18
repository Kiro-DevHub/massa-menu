import { expect, test, type Page } from '@playwright/test'
import { NOW, midweek, persisted } from './fixture'

const OUT = 'screenshots'

/** Кладёт состояние прямо в IndexedDB (idb-keyval: база keyval-store, стор keyval) и перезагружает. */
async function seed(page: Page, value: string | null) {
  await page.goto('./')
  await page.evaluate(async (v) => {
    await new Promise<void>((res, rej) => {
      const req = indexedDB.open('keyval-store')
      req.onupgradeneeded = () => req.result.createObjectStore('keyval')
      req.onsuccess = () => {
        const tx = req.result.transaction('keyval', 'readwrite')
        const st = tx.objectStore('keyval')
        if (v == null) st.delete('massa-menu')
        else st.put(v, 'massa-menu')
        tx.oncomplete = () => res()
        tx.onerror = () => rej(tx.error)
      }
      req.onerror = () => rej(req.error)
    })
  }, value)
  await page.reload()
  await page.waitForSelector('nav[aria-label="Разделы"]')
}

async function open(page: Page, hash: string) {
  await page.goto(`./#${hash}`)
  await page.waitForSelector('nav[aria-label="Разделы"], [aria-label="Закрыть режим готовки"]')
  await page.waitForTimeout(500)
}

/** Кадр сверху и, если экран длинный, кадр с конца прокрутки. */
async function shoot(page: Page, path: string) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `${path}.png` })
  const long = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight * 1.15)
  if (!long) return
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(250)
  await page.screenshot({ path: `${path}-end.png` })
}

async function noHorizontalScroll(page: Page) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(over, 'горизонтальная прокрутка').toBeLessThanOrEqual(0)
}

const SCREENS: [string, string][] = [
  ['01-today', '/'],
  ['02-recipe', '/recipe/2026-10-19/d'],
  ['03-cook', '/recipe/2026-10-19/d/cook'],
  ['04-prep', '/prep'],
  ['05-session', '/prep/tue'],
  ['06-stock-fridge', '/stock'],
  ['08-shop', '/shop'],
  ['09-weight', '/weight'],
  ['10-settings', '/settings'],
]

for (const theme of ['dark', 'light'] as const) {
  test.describe(`экраны, ${theme}`, () => {
    test.use({ colorScheme: theme })

    test('с данными середины недели', async ({ page }) => {
      await page.clock.install({ time: NOW })
      const timer = [{ id: 't1', end: NOW.getTime() + 252_000, total: 900, label: 'Рис варится', rang: false }]
      await seed(page, persisted(midweek(), theme, timer))
      for (const [name, hash] of SCREENS) {
        await open(page, hash)
        await noHorizontalScroll(page)
        await shoot(page, `${OUT}/${theme}/${name}`)
      }
      // Кладовка — второй сегмент склада.
      await open(page, '/stock')
      await page.getByRole('tab', { name: 'Кладовка' }).click()
      await page.waitForTimeout(300)
      await shoot(page, `${OUT}/${theme}/07-stock-pantry`)
      // Шторка «Вне меню».
      await open(page, '/')
      await page.getByRole('button', { name: 'Добавить' }).first().click()
      await page.waitForTimeout(600)
      await page.screenshot({ path: `${OUT}/${theme}/11-extra-drawer.png` })
    })

    test('первый запуск: пустые состояния', async ({ page }) => {
      await page.clock.install({ time: NOW })
      await seed(page, persisted({ pantry: {}, staples: {}, fridge: [], log: {}, bought: [], weight: [] }, theme))
      for (const [name, hash] of [
        ['20-empty-today', '/'],
        ['21-empty-fridge', '/stock'],
        ['22-empty-shop', '/shop'],
        ['23-empty-weight', '/weight'],
      ] as const) {
        await open(page, hash)
        await noHorizontalScroll(page)
        await shoot(page, `${OUT}/${theme}/${name}`)
      }
    })
  })
}

test.describe('ширина 375 и 430 без горизонтальной прокрутки', () => {
  for (const width of [375, 430]) {
    test(`${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.clock.install({ time: NOW })
      await seed(page, persisted(midweek(), 'dark'))
      for (const [, hash] of SCREENS) {
        await open(page, hash)
        await noHorizontalScroll(page)
      }
      await open(page, '/stock')
      await page.getByRole('tab', { name: 'Кладовка' }).click()
      await noHorizontalScroll(page)
    })
  }
})
