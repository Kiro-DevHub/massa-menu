import { Check, Timer } from 'lucide-react'
import { toast } from 'sonner'
import type { Step } from '@/data'
import { unlockAudio } from '@/lib/audio'
import { mmss } from '@/logic/format'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useUi } from '@/store/ui-store'
import { Group } from './common'

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
        'inline-flex items-center gap-2 self-start rounded-full bg-saffron/16 font-semibold text-saffron-ink transition-transform duration-[175ms] active:scale-95',
        size === 'lg' ? 'h-14 px-5 text-[18px]' : 'h-10 px-3.5 text-[14.5px]',
      )}
      aria-label={`Запустить таймер ${mmss(step.timer)}: ${label}`}
    >
      <Timer className={size === 'lg' ? 'size-6' : 'size-[18px]'} aria-hidden />
      <span className="num">{mmss(step.timer)}</span>
    </button>
  )
}

/** Шаги одним списком: номер — это и отметка «сделано», у шагов с таймером кнопка запуска. */
export function StepsList({ steps, stepKey }: { steps: readonly Step[]; stepKey: string }) {
  const done = useUi((s) => s.doneSteps[stepKey])
  const toggle = useUi((s) => s.toggleStep)
  return (
    <Group>
      {steps.map((s, i) => {
        const on = !!done?.[i]
        return (
          <li key={i} className="flex gap-3.5 px-4 py-4">
            <button
              type="button"
              aria-pressed={on}
              aria-label={`Шаг ${i + 1}${on ? ', сделан' : ', отметить сделанным'}`}
              onClick={() => toggle(stepKey, i)}
              className={cn(
                'relative grid size-8 flex-none place-items-center rounded-full font-display text-[14px] transition-colors duration-[175ms] after:absolute after:-inset-1.5',
                on ? 'bg-ok text-white' : 'bg-surface-2 text-ink-2',
              )}
            >
              {on ? <Check className="size-4" strokeWidth={3} aria-hidden /> : i + 1}
            </button>
            <div className={cn('flex min-w-0 flex-1 flex-col gap-2.5 pt-1 transition-opacity duration-[175ms]', on && 'opacity-50')}>
              <p className="text-[16px] leading-relaxed text-pretty">{s.text}</p>
              <TimerButton step={s} />
            </div>
          </li>
        )
      })}
    </Group>
  )
}
