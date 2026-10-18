import { expect, test } from '@playwright/test'

test('манифест и иконки на месте, Chrome не видит препятствий к установке', async ({ page, context }) => {
  await page.goto('./')
  await page.waitForSelector('nav[aria-label="Разделы"]')
  await page.evaluate(() => navigator.serviceWorker.ready)

  const manifest = await page.evaluate(async () => {
    const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!.href
    return (await fetch(href)).json()
  })
  expect(manifest.name).toBe('Меню на массу')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true)

  // Тот же механизм, которым Chrome решает, показывать ли «Установить приложение».
  const cdp = await context.newCDPSession(page)
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors')
  // in-incognito: Playwright всегда открывает инкогнито-контекст, к приложению это не относится.
  expect(installabilityErrors.filter((e) => e.errorId !== 'in-incognito')).toEqual([])
})

test('работает без сети после первого визита', async ({ page, context }) => {
  await page.goto('./')
  await page.waitForSelector('nav[aria-label="Разделы"]')
  await page.evaluate(() => navigator.serviceWorker.ready)
  // Ждём, пока SW возьмёт страницу под контроль.
  await page.reload()
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('navigation', { name: 'Разделы' })).toBeVisible()
  await page.goto('./#/weight')
  await expect(page.getByRole('heading', { name: 'Вес' })).toBeVisible()
  await context.setOffline(false)
})
