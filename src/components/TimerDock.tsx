import { AnimatePresence, motion } from 'motion/react'
import { BellRing, Plus } from 'lucide-react'
import { useEffect } from 'react'
import { ring } from '@/lib/audio'
import { mmss } from '@/logic/format'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useNow } from '@/store/hooks'
import { TABBAR_H } from './TabBar'

/** Плавающая стопка таймеров над таб-баром. Время окончания хранится, поэтому таймеры переживают перезагрузку. */
export function TimerDock({ withTabBar }: { withTabBar: boolean }) {
  const timers = useAppStore((s) => s.timers)
  const stop = useAppStore((s) => s.stopTimer)
  const addMinute = useAppStore((s) => s.addMinute)
  const markRang = useAppStore((s) => s.markRang)
  const now = useNow(timers.length > 0, 500)

  useEffect(() => {
    for (const t of timers)
      if (!t.rang && t.end <= now) {
        ring()
        markRang(t.id)
      }
  }, [now, timers, markRang])

  const bottom = withTabBar ? `calc(${TABBAR_H + 10}px + env(safe-area-inset-bottom, 0px))` : `calc(14px + env(safe-area-inset-bottom, 0px))`

  return (
    <div className="pointer-events-none fixed inset-x-0 z-30 px-gutter" style={{ bottom }} aria-live="polite">
      <div className="mx-auto flex max-w-[560px] flex-col gap-2">
        <AnimatePresence initial={false}>
          {timers.map((t) => {
            const left = (t.end - now) / 1000
            const done = left <= 0
            const progress = Math.min(1, Math.max(0, 1 - left / t.total))
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className={cn(
                  'pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-2xl py-2 pr-2 pl-4 shadow-[var(--shadow-float)]',
                  done
                    ? 'animate-[ring-pulse_1s_ease-in-out_infinite] bg-saffron text-on-saffron'
                    : 'border border-white/8 bg-[var(--dock)] text-[var(--dock-fg)]',
                )}
                role="timer"
                aria-label={`${t.label}: ${done ? 'готово' : mmss(left)}`}
              >
                {!done && (
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-saffron"
                    style={{ transform: `scaleX(${progress})`, transition: 'transform 0.5s linear' }}
                  />
                )}
                {done ? (
                  <BellRing className="size-6 flex-none" aria-hidden />
                ) : (
                  <span className="font-display min-w-[4.4ch] flex-none text-[22px] leading-none font-semibold text-saffron">{mmss(left)}</span>
                )}
                <span className="min-w-0 flex-1 text-[14px] leading-tight font-medium">
                  <span className="line-clamp-2">{done ? `Готово: ${t.label}` : t.label}</span>
                </span>
                {!done && (
                  <button
                    type="button"
                    onClick={() => addMinute(t.id)}
                    className="inline-flex h-11 flex-none items-center rounded-xl bg-white/10 px-2.5 text-[14px] font-semibold"
                    aria-label={`Добавить минуту: ${t.label}`}
                  >
                    <Plus className="size-4" aria-hidden />1 мин
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => stop(t.id)}
                  className={cn('h-11 flex-none rounded-xl px-3.5 text-[14px] font-semibold', done ? 'bg-black/12' : 'bg-white/10')}
                >
                  {done ? 'Ок' : 'Стоп'}
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
