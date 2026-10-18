import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { ChevronLeft, ChevronRight, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Redirect, useLocation } from 'wouter'
import { SESSIONS, SLOTS, type SessionId, type Slot, type Step } from '@/data'
import { TimerButton } from '@/components/Steps'
import { recipeAt } from '@/logic/menu'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

type Props = { kind: 'recipe'; date: string; slot: string } | { kind: 'session'; sid: string }

/** Держит экран включённым, пока открыт режим готовки (iOS 16.4+). Возвращает, удалось ли. */
function useWakeLock() {
  const [active, setActive] = useState(false)
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let alive = true
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
        if (!alive) return void lock.release()
        setActive(true)
        lock.addEventListener('release', () => alive && setActive(false))
      } catch {
        setActive(false)
      }
    }
    const onVis = () => document.visibilityState === 'visible' && void request()
    void request()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVis)
      void lock?.release()
    }
  }, [])
  return active
}

export default function CookScreen(props: Props) {
  const [, navigate] = useLocation()
  let title = ''
  let steps: readonly Step[] = []
  let back = '/'
  if (props.kind === 'recipe' && SLOTS.some((s) => s.key === props.slot)) {
    const r = recipeAt(props.date, props.slot as Slot)
    title = r.name
    steps = r.steps
    back = `/recipe/${props.date}/${props.slot}`
  } else if (props.kind === 'session' && props.sid in SESSIONS) {
    const s = SESSIONS[props.sid as SessionId]
    title = `Заготовка: ${s.name}`
    steps = s.steps
    back = `/prep/${props.sid}`
  }
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const awake = useWakeLock()
  const timers = useAppStore((s) => s.timers.length)
  const total = steps.length
  const step = steps[i]

  const go = (n: number) => {
    if (n < 0 || n >= total) return
    setDir(n > i ? 1 : -1)
    setI(n)
  }
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 60) return
    go(i + (info.offset.x < 0 ? 1 : -1))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(i + 1)
      if (e.key === 'ArrowLeft') go(i - 1)
      if (e.key === 'Escape') navigate(back)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!step) return <Redirect to="/" />

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-bg pt-safe">
      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col px-gutter">
        <header className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate(back)}
            aria-label="Закрыть режим готовки"
            className="-ml-2 grid size-11 place-items-center rounded-xl text-muted-foreground active:bg-surface-2"
          >
            <X className="size-6" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold">{title}</div>
            <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              {awake ? (
                <>
                  <Sun className="size-3.5 text-saffron-ink" aria-hidden />
                  Экран не погаснет
                </>
              ) : (
                'Свайпай влево и вправо'
              )}
            </div>
          </div>
          <div className="num font-display text-[15px] font-semibold text-muted-foreground" aria-live="polite">
            {i + 1}/{total}
          </div>
        </header>

        <div className="mt-3 flex gap-1" aria-hidden>
          {steps.map((_, k) => (
            <button
              key={k}
              type="button"
              tabIndex={-1}
              onClick={() => go(k)}
              className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', k <= i ? 'bg-saffron' : 'bg-surface-3')}
            />
          ))}
        </div>

        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.section
              key={i}
              custom={dir}
              variants={{
                enter: (d: number) => ({ x: d * 60, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d * -60, opacity: 0, transition: { duration: 0.14 } }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              drag="x"
              dragDirectionLock
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={onDragEnd}
              className="flex h-full touch-pan-y flex-col justify-center gap-6 pt-6 pb-24"
              aria-label={`Шаг ${i + 1} из ${total}`}
            >
              <div className="font-display text-[88px] leading-[0.85] font-light tracking-[-0.05em] text-saffron-ink">{i + 1}</div>
              <p className="text-[24px] leading-[1.4] font-medium text-pretty">{step.text}</p>
              <TimerButton step={step} size="lg" />
            </motion.section>
          </AnimatePresence>
        </div>

        <nav className="flex gap-3 pt-2 pb-[calc(16px+env(safe-area-inset-bottom,0px))]" style={{ marginBottom: timers * 68 }}>
          <button
            type="button"
            onClick={() => go(i - 1)}
            disabled={i === 0}
            className="inline-flex h-14 flex-1 items-center justify-center gap-1 rounded-[18px] bg-surface text-[17px] font-semibold shadow-[var(--shadow-card)] disabled:opacity-40 dark:border dark:border-line"
          >
            <ChevronLeft className="size-5" aria-hidden />
            Назад
          </button>
          {i < total - 1 ? (
            <button
              type="button"
              onClick={() => go(i + 1)}
              className="inline-flex h-14 flex-[1.4] items-center justify-center gap-1 rounded-[18px] bg-saffron text-[17px] font-semibold text-on-saffron"
            >
              Дальше
              <ChevronRight className="size-5" aria-hidden />
            </button>
          ) : (
            <button type="button" onClick={() => navigate(back)} className="inline-flex h-14 flex-[1.4] items-center justify-center rounded-[18px] bg-ink text-[17px] font-semibold text-bg">
              Готово
            </button>
          )}
        </nav>
      </div>
    </div>
  )
}
