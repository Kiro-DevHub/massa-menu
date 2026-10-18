import { defineConfig } from '@playwright/test'

// Прогон по продакшен-сборке: так проверяются и service worker, и офлайн.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173/massa-menu/',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    // Можно указать уже скачанный Chromium, если `npx playwright install` недоступен.
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://127.0.0.1:4173/massa-menu/',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
