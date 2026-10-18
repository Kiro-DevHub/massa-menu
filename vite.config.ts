import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const BG = '#0d0f12'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages: https://kiro-devhub.github.io/massa-menu/
  base: '/massa-menu/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Обновление по согласию: приложение не перезагрузится посреди готовки.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/massa-menu/',
        name: 'Меню на массу',
        short_name: 'Меню',
        description: 'Недельное меню для набора массы: рецепты, заготовки, склад продуктов и список покупок.',
        lang: 'ru',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: BG,
        theme_color: BG,
        categories: ['food', 'health', 'lifestyle'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Полный офлайн: всё приложение, шрифты и иконки в предкэше.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  // Один бандл на всё приложение: оно целиком лежит в предкэше SW, дробить на чанки незачем.
  build: { chunkSizeWarningLimit: 800 },
})
