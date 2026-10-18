import { test, type Page } from '@playwright/test'
import { NOW, midweek, persisted } from './fixture'

// Макет экрана «Сегодня»: снимки для согласования дизайна.
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
  await page.waitForTimeout(700)
}

for (const theme of ['dark', 'light'] as const) {
  test(`сегодня, ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    await page.clock.install({ time: NOW })
    await seed(page, persisted(midweek(), theme))
    const dir = `screenshots/today/${theme}`
    await page.screenshot({ path: `${dir}/1-top.png` })
    await page.evaluate(() => window.scrollBy(0, 640))
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${dir}/2-middle.png` })
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${dir}/3-end.png` })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.getByRole('tab', { name: /^Вт/ }).click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${dir}/4-tuesday.png`, fullPage: true })
  })
}
