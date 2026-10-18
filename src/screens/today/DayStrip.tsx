import { addDays, dayOfMonth, DW, weekStart, type ISODate } from '@/logic/dates'
import { dayDots } from '@/logic/nutrition'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

/** Полоса Пн–Вс недели выбранного дня с точками съеденных приёмов. */
export function DayStrip({ today, selected, onSelect }: { today: ISODate; selected: ISODate; onSelect: (d: ISODate) => void }) {
  const data = useAppStore((s) => s.data)
  const ws = weekStart(selected)
  return (
    <div role="tablist" aria-label="Дни недели" className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 7 }, (_, i) => {
        const d = addDays(ws, i)
        const sel = d === selected
        const isToday = d === today
        const dots = dayDots(data, d)
        const eaten = dots.filter(Boolean).length
        return (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={sel}
            aria-label={`${DW[i]}, ${dayOfMonth(d)}${isToday ? ', сегодня' : ''}, съедено ${eaten} из 5`}
            onClick={() => onSelect(d)}
            className={cn(
              'relative flex h-[62px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-[14px] border transition-[background-color,border-color,color] duration-200',
              sel ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink active:bg-surface-2',
            )}
          >
            <span className={cn('text-[12px] font-semibold', sel ? 'text-bg/70' : isToday ? 'text-saffron-ink' : 'text-muted-foreground')}>{DW[i]}</span>
            <span className="font-display text-[16px] leading-none font-semibold">{dayOfMonth(d)}</span>
            <span className="mt-1 flex h-1 gap-[3px]" aria-hidden>
              {dots.map((on, k) => (
                <i key={k} className={cn('block size-1 rounded-full', on ? 'bg-saffron' : sel ? 'bg-bg/30' : 'bg-surface-3')} />
              ))}
            </span>
            {isToday && !sel && <span aria-hidden className="absolute -top-px left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-b-full bg-saffron" />}
          </button>
        )
      })}
    </div>
  )
}
