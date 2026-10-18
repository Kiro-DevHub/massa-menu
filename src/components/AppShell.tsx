import { Settings2 } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { TABBAR_H, TabBar } from './TabBar'
import { TimerDock } from './TimerDock'

/** Слово-марка: «Меню» шафраном, «на массу» приглушённо. */
export function Wordmark() {
  return (
    <span className="font-display text-[13px] font-semibold tracking-[0.08em] uppercase">
      <span className="text-saffron-ink">Меню</span> <span className="text-muted-foreground">на массу</span>
    </span>
  )
}

/** Верхняя строка экранов верхнего уровня: марка и настройки. */
export function TopRow() {
  return (
    <div className="flex h-12 items-center justify-between">
      <Wordmark />
      <Link
        href="/settings"
        aria-label="Настройки"
        className="-mr-2.5 grid size-11 place-items-center rounded-xl text-muted-foreground active:bg-surface-2"
      >
        <Settings2 className="size-[22px]" aria-hidden />
      </Link>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [path] = useLocation()
  const cooking = path.endsWith('/cook')
  const timers = useAppStore((s) => s.timers.length)
  const mainRef = useRef<HTMLElement>(null)

  // Новый экран — наверх и фокус на содержимое (для VoiceOver).
  useEffect(() => {
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [path])

  const padBottom = cooking ? 0 : TABBAR_H + 24 + timers * 68

  return (
    <>
      {/* Подложка под чёлку, чтобы контент не просвечивал под статус-баром. */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[env(safe-area-inset-top,0px)] bg-[var(--statusbar)]" />
      <main
        ref={mainRef}
        tabIndex={-1}
        className={cn('mx-auto max-w-[560px] px-gutter pt-safe outline-none', cooking && 'max-w-none px-0')}
        style={{ paddingBottom: `calc(${padBottom}px + env(safe-area-inset-bottom, 0px))` }}
      >
        {children}
      </main>
      <TimerDock withTabBar={!cooking} />
      {!cooking && <TabBar />}
    </>
  )
}
