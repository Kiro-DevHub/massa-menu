import { motion } from 'motion/react'
import { ChevronRight, Undo2 } from 'lucide-react'
import { Link } from 'wouter'
import type { SlotInfo } from '@/data'
import { CHECK_PATH } from '@/components/icons'
import { MacroLine } from '@/components/common'
import { SourceChip } from '@/components/SourceChip'
import type { ISODate } from '@/logic/dates'
import { recipeAt } from '@/logic/menu'
import type { MealSource } from '@/logic/sources'
import type { SlotEntry } from '@/logic/types'
import { cn } from '@/lib/utils'

interface Props {
  date: ISODate
  today: ISODate
  slot: SlotInfo
  entry: SlotEntry | undefined
  source: MealSource
  isNext: boolean
  onEat: () => void
  onSkip: () => void
  onUndo: () => void
}

/** Карточка приёма: блюдо, КБЖУ, откуда оно, большая кнопка «Съел» и «Не ел». */
export function MealCard({ date, today, slot, entry, source, isNext, onEat, onSkip, onUndo }: Props) {
  const r = recipeAt(date, slot.key)
  const eaten = entry?.st === 'eaten'
  const skipped = entry?.st === 'skipped'
  const canMark = date <= today

  return (
    <article
      className={cn(
        'flex items-stretch overflow-hidden rounded-2xl border bg-surface shadow-[var(--shadow-card)] transition-[border-color,box-shadow] duration-300',
        isNext ? 'border-saffron shadow-[0_0_0_1px_var(--saffron),var(--shadow-card)]' : 'border-line',
      )}
    >
      <Link href={`/recipe/${date}/${slot.key}`} className="flex min-w-0 flex-1 flex-col gap-1.5 py-3.5 pr-2 pl-4 active:bg-surface-2/60">
        <div className="flex items-center gap-2">
          <span className={cn('text-[12px] font-semibold tracking-[0.08em] uppercase', isNext ? 'text-saffron-ink' : 'text-muted-foreground')}>
            {slot.name}
          </span>
          <span className="num text-[12px] text-muted-foreground">{slot.time}</span>
          {isNext && <span className="text-[12px] font-medium text-saffron-ink">· дальше по плану</span>}
        </div>
        <h3 className={cn('text-[17px] leading-snug font-semibold', (eaten || skipped) && 'text-muted-foreground', skipped && 'line-through decoration-1')}>
          {r.name}
        </h3>
        <MacroLine m={r} />
        <div className="mt-0.5 flex flex-wrap gap-1.5">
          <SourceChip src={source} today={today} />
        </div>
      </Link>

      <div className="flex w-[84px] flex-none flex-col border-l border-line">
        {canMark ? (
          <>
            <button
              type="button"
              onClick={eaten ? undefined : onEat}
              disabled={eaten || skipped}
              aria-label={eaten ? `${slot.name}: съедено` : `Съел: ${r.name}`}
              className="group flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[13px] font-semibold text-ink disabled:cursor-default"
            >
              <span
                className={cn(
                  'grid size-11 place-items-center rounded-full border-2 transition-[background-color,border-color,transform] duration-200 group-active:scale-90',
                  eaten ? 'border-ok bg-ok text-white' : skipped ? 'border-line text-transparent' : 'border-saffron/70 bg-saffron/10 text-saffron-ink',
                )}
              >
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <motion.path d={CHECK_PATH} initial={false} animate={{ pathLength: eaten ? 1 : 0, opacity: eaten ? 1 : 0 }} transition={{ duration: 0.28, ease: 'easeOut' }} />
                </svg>
              </span>
              <span className={cn(eaten ? 'text-ok' : skipped ? 'text-muted-foreground' : 'text-ink')}>{eaten ? 'Съел' : skipped ? 'Не ел' : 'Съел'}</span>
            </button>
            {entry ? (
              <button
                type="button"
                onClick={onUndo}
                className="flex h-11 items-center justify-center gap-1 border-t border-line text-[13px] font-medium text-muted-foreground active:bg-surface-2"
              >
                <Undo2 className="size-3.5" aria-hidden />
                Отменить
              </button>
            ) : (
              <button
                type="button"
                onClick={onSkip}
                className="h-11 border-t border-line text-[13px] font-medium text-muted-foreground active:bg-surface-2"
              >
                Не ел
              </button>
            )}
          </>
        ) : (
          <Link href={`/recipe/${date}/${slot.key}`} aria-label={`Рецепт: ${r.name}`} className="grid flex-1 place-items-center text-muted-foreground">
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        )}
      </div>
    </article>
  )
}
