import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Иконки из public/icon.svg: фон у иконки сплошной, поэтому подложки apple и maskable того же цвета.
const bg = '#0d0f12'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: bg } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: bg } },
  },
  images: ['public/icon.svg'],
})
