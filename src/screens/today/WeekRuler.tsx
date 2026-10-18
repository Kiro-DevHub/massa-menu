import { addDays, dayOfMonth, DW, weekStart, type ISODate } from '@/logic/dates'
import { dayDots } from '@/logic/nutrition'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

/** Линейка недели: день, число и пять засечек съеденных приёмов. Без плиток. */
export function WeekRuler({ today, selected, onSelect }: { today: ISODate; selected: ISODate; onSelect: (d: ISODate) => void }) {
  const data = useAppStore((s) => s.data)
  const ws = weekStart(selected)
  return (
    <div role="tablist" aria-label="Дни недели" className="grid grid-cols-7">
      {Array.from({ length: 7 }, (_, i) => {
        const d = addDays(ws, i)
        const sel = d === selected
        const isToday = d === today
        const dots = dayDots(data, d)
        return (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={sel}
            aria-label={`${DW[i]}, ${dayOfMonth(d)}${isToday ? ', сегодня' : ''}, съедено ${dots.filter(Boolean).length} из 5`}
            onClick={() => onSelect(d)}
            className={cn(
              'relative flex h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-[14px] transition-colors duration-[175ms]',
              sel ? 'bg-surface shadow-[var(--shadow-card)]' : 'active:bg-surface-2',
            )}
          >
            <span className={cn('text-[12px] leading-none font-medium', isToday ? 'text-saffron-ink' : 'text-muted-foreground')}>
              {DW[i]}
            </span>
            <span className={cn('font-display text-[17px] leading-none', sel ? 'font-semibold text-ink' : 'font-normal text-ink-2')}>
              {dayOfMonth(d)}
            </span>
            <span className="flex gap-[2px]" aria-hidden>
              {dots.map((on, k) => (
                <i key={k} className={cn('block h-[3px] w-[5px] rounded-full', on ? 'bg-saffron' : 'bg-surface-3')} />
              ))}
            </span>
          </button>
        )
      })}
    </div>
  )
}
