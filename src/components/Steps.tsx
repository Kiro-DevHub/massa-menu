import { Check, Timer } from 'lucide-react'
import { toast } from 'sonner'
import type { Step } from '@/data'
import { unlockAudio } from '@/lib/audio'
import { mmss } from '@/logic/format'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useUi } from '@/store/ui-store'

/** Кнопка таймера внутри шага. */
export function TimerButton({ step, size = 'md' }: { step: Step; size?: 'md' | 'lg' }) {
  const start = useAppStore((s) => s.startTimer)
  if (!step.timer) return null
  const label = step.timerLabel ?? 'Таймер'
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        unlockAudio()
        start(step.timer!, label)
        toast(`Таймер запущен: ${label}`, { duration: 2000 })
      }}
      className={cn(
        'inline-flex items-center gap-2 self-start rounded-full border border-saffron/60 bg-saffron/12 font-semibold text-saffron-ink active:scale-95 transition-transform',
        size === 'lg' ? 'h-14 px-5 text-[18px]' : 'h-10 px-3.5 text-[14.5px]',
      )}
      aria-label={`Запустить таймер ${mmss(step.timer)}: ${label}`}
    >
      <Timer className={size === 'lg' ? 'size-6' : 'size-[18px]'} aria-hidden />
      <span className="num">{mmss(step.timer)}</span>
    </button>
  )
}

/** Список шагов: тап по шагу отмечает его, у шагов с таймером — кнопка запуска. */
export function StepsList({ steps, stepKey }: { steps: readonly Step[]; stepKey: string }) {
  const done = useUi((s) => s.doneSteps[stepKey])
  const toggle = useUi((s) => s.toggleStep)
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((s, i) => {
        const on = !!done?.[i]
        return (
          <li key={i} className={cn('flex gap-3 rounded-2xl border border-line bg-surface p-3.5 transition-opacity', on && 'opacity-55')}>
            <button
              type="button"
              aria-pressed={on}
              aria-label={`Шаг ${i + 1}${on ? ', выполнен' : ''}`}
              onClick={() => toggle(stepKey, i)}
              className={cn(
                'grid size-9 flex-none place-items-center rounded-full border-2 font-display text-[14px] font-semibold transition-colors after:absolute',
                on ? 'border-ok bg-ok text-white' : 'border-line text-saffron-ink',
              )}
            >
              {on ? <Check className="size-4" strokeWidth={3} aria-hidden /> : i + 1}
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5 pt-1">
              <p className="text-[16px] leading-relaxed">{s.text}</p>
              <TimerButton step={s} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}
