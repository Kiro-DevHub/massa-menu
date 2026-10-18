import { useEffect, useSyncExternalStore } from 'react'
import { useAppStore } from '@/store/app-store'

const query = '(prefers-color-scheme: dark)'

function subscribeSystem(cb: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const systemDark = () => window.matchMedia(query).matches

/** Итоговая тема с учётом «авто». */
export function useResolvedTheme(): 'light' | 'dark' {
  const pref = useAppStore((s) => s.settings.theme)
  const sysDark = useSyncExternalStore(subscribeSystem, systemDark, () => true)
  return pref === 'auto' ? (sysDark ? 'dark' : 'light') : pref
}

const THEME_COLOR = { light: '#eceee8', dark: '#0f100e' } as const

/** Вешает .dark на <html> и синхронизирует цвет статус-бара. */
export function useApplyTheme() {
  const theme = useResolvedTheme()
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.dataset.theme = theme
    for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) m.content = THEME_COLOR[theme]
  }, [theme])
}
