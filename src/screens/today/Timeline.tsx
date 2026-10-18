import { motion } from 'motion/react'
import { Check, ChevronRight, CookingPot, Minus, Plus, Snowflake, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'wouter'
import { BATCH_NAMES, PRODUCTS, RECIPES, SESSIONS, SLOTS, type SessionId, type Slot, type SlotInfo } from '@/data'
import { MacroLine, Tape } from '@/components/common'
import { SourceLine } from '@/components/SourceChip'
import { Button } from '@/components/ui/button'
import type { ISODate } from '@/logic/dates'
import { fmtQ } from '@/logic/format'
import { recipeAt } from '@/logic/menu'
import type { Reminder } from '@/logic/reminders'
import type { MealSource } from '@/logic/sources'
import type { Extra, SlotEntry } from '@/logic/types'
import { cn } from '@/lib/utils'

const EASE = [0.24, 1, 0.4, 1] as const

/** Строка таймлайна: время слева, маркер на линии, содержимое справа. */
function Row({ time, marker, children, timeTone }: { time?: string; marker: ReactNode; children: ReactNode; timeTone?: string }) {
  return (
    <motion.li layout="position" transition={{ duration: 0.41, ease: EASE }} className="grid grid-cols-[46px_28px_minmax(0,1fr)] items-start">
      <span className={cn('num pt-[3px] pr-1 text-right text-[12.5px] font-medium text-muted-foreground', timeTone)}>{time}</span>
      <span className="relative z-[1] flex justify-center pt-[3px]">{marker}</span>
      <div className="min-w-0 pb-6 pl-1">{children}</div>
    </motion.li>
  )
}

const dot = 'grid place-items-center rounded-full bg-bg'

function MealMarker({ state }: { state: 'eaten' | 'skipped' | 'next' | 'pending' }) {
  if (state === 'eaten')
    return (
      <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }} className={cn(dot, 'size-[22px] bg-ok text-white')}>
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      </motion.span>
    )
  if (state === 'skipped')
    return (
      <span className={cn(dot, 'size-[22px] border-2 border-surface-3 text-muted-foreground')}>
        <Minus className="size-3" strokeWidth={3} aria-hidden />
      </span>
    )
  if (state === 'next')
    return (
      <span className={cn(dot, 'size-[22px] border-2 border-saffron')}>
        <span className="size-2 rounded-full bg-saffron" />
      </span>
    )
  return <span className={cn(dot, 'mt-[3px] size-4 border-2 border-surface-3')} />
}

interface MealProps {
  date: ISODate
  today: ISODate
  slot: SlotInfo
  entry: SlotEntry | undefined
  source: MealSource
  isNext: boolean
  /** Дата на скотче контейнера, если блюдо берётся из холодильника. */
  tape?: string
  onEat: () => void
  onSkip: () => void
  onUndo: () => void
}

function MealNode({ date, today, slot, entry, source, isNext, tape, onEat, onSkip, onUndo }: MealProps) {
  const r = recipeAt(date, slot.key)
  const href = `/recipe/${date}/${slot.key}`
  const canMark = date <= today
  const state = entry ? (entry.st === 'eaten' ? 'eaten' : 'skipped') : isNext ? 'next' : 'pending'

  // Отмеченный приём: одна строка названия и строка статуса с «Отменить».
  if (entry)
    return (
      <Row time={slot.time} marker={<MealMarker state={state} />}>
        <Link href={href} className="block">
          <div className={cn('text-[16px] leading-snug font-medium text-ink-2', entry.st === 'skipped' && 'text-muted-foreground line-through decoration-1')}>{r.name}</div>
        </Link>
        <div className="num -mb-2 flex flex-wrap items-center gap-x-3 text-[13px] text-muted-foreground">
          <span>{r.k} ккал</span>
          <SourceLine src={source} today={today} className="text-[13px]" />
          <button type="button" onClick={onUndo} className="-my-1 h-9 rounded-[10px] px-1.5 font-medium text-ink-2 underline decoration-line underline-offset-4 active:bg-surface-2">
            Отменить
          </button>
        </div>
      </Row>
    )

  // Ближайший приём: раскрытая карточка, главное действие экрана.
  if (isNext)
    return (
      <Row time={slot.time} timeTone="text-saffron-ink font-semibold" marker={<MealMarker state="next" />}>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.41, ease: EASE }}
          className={cn('relative -mt-3 rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)] ring-1 ring-saffron/35', tape && 'mt-2 pt-6')}
        >
          {tape && <Tape className="absolute -top-3.5 left-4" label={`Контейнер приготовлен ${tape}`}>{tape}</Tape>}
          <div className="text-[13px] font-semibold text-saffron-ink">{slot.name}, дальше по плану</div>
          <Link href={href} className="mt-1 flex items-start gap-2">
            <h3 className="min-w-0 flex-1 text-[21px] leading-tight font-semibold tracking-[-0.01em]">{r.name}</h3>
            <ChevronRight className="mt-1 size-5 flex-none text-muted-foreground" aria-hidden />
          </Link>
          <div className="mt-2 flex flex-col gap-1.5">
            <SourceLine src={source} today={today} />
            <MacroLine m={r} />
          </div>
          {canMark && (
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <Button size="lg" onClick={onEat} className="h-[52px]">
                <Check strokeWidth={2.6} aria-hidden />
                Съел
              </Button>
              <Button size="lg" variant="secondary" onClick={onSkip} className="h-[52px] px-5 text-[15px]">
                Не ел
              </Button>
            </div>
          )}
        </motion.div>
      </Row>
    )

  // Остальные: содержимое и одна круглая галочка. «Не ел» — на раскрытой карточке и в рецепте.
  return (
    <Row time={slot.time} marker={<MealMarker state="pending" />}>
      <div className="flex items-start gap-3">
        <Link href={href} className="block min-w-0 flex-1">
          <div className="text-[13px] text-muted-foreground">{slot.name}</div>
          <div className="mt-0.5 text-[17px] leading-snug font-semibold">{r.name}</div>
          <div className="mt-1 flex flex-col gap-1">
            <MacroLine m={r} />
            <SourceLine src={source} today={today} />
          </div>
        </Link>
        {canMark ? (
          <button
            type="button"
            onClick={onEat}
            aria-label={`Съел: ${r.name}`}
            className="mt-3 grid size-11 flex-none place-items-center rounded-full border-2 border-saffron/55 text-saffron-ink transition-transform duration-[175ms] active:scale-90 active:bg-saffron/15"
          >
            <Check className="size-5" strokeWidth={2.6} aria-hidden />
          </button>
        ) : (
          <ChevronRight className="mt-6 size-5 flex-none text-muted-foreground" aria-hidden />
        )}
      </div>
    </Row>
  )
}

function SessionNode({ sid, done }: { sid: SessionId; done: boolean }) {
  const s = SESSIONS[sid]
  return (
    <Row
      time={s.when === 'morning' ? 'утро' : 'вечер'}
      marker={
        <span className={cn('grid size-7 place-items-center rounded-[9px] bg-bg', done ? 'text-ok' : 'bg-saffron/16 text-saffron-ink')}>
          <CookingPot className="size-4" aria-hidden />
        </span>
      }
    >
      <Link href={`/prep/${sid}`} className="-mt-1 flex items-start gap-2 rounded-2xl border border-dashed border-saffron/45 px-3.5 py-3 active:bg-surface-2">
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-saffron-ink">{s.when === 'morning' ? 'Утром' : 'Вечером'} заготовка, около {s.time} мин</span>
          <span className="mt-0.5 block text-[16px] font-semibold">{s.name}</span>
          <span className="mt-0.5 block text-[13.5px] text-muted-foreground">
            {s.makes.map((m) => `${BATCH_NAMES[RECIPES[m.recipe].batch!]} ×${m.n}`).join(', ')} {s.covers}
          </span>
        </span>
        <ChevronRight className="mt-5 size-5 flex-none text-muted-foreground" aria-hidden />
      </Link>
    </Row>
  )
}

function DefrostNode({ items }: { items: { id: keyof typeof PRODUCTS; q: number }[] }) {
  return (
    <Row
      time="вечер"
      marker={
        <span className="grid size-7 place-items-center rounded-[9px] bg-ice/15 text-ice">
          <Snowflake className="size-4" aria-hidden />
        </span>
      }
    >
      <div className="text-[16px] font-semibold">Переложи из морозилки в холодильник</div>
      <div className="mt-0.5 text-[13.5px] text-muted-foreground">
        {items.map((i) => `${PRODUCTS[i.id].name} ${fmtQ(i.q, PRODUCTS[i.id].unit)}`).join(', ')}. Это на завтра, за ночь разморозится.
      </div>
    </Row>
  )
}

function ExtraNode({ x, onRemove }: { x: Extra; onRemove: () => void }) {
  return (
    <Row marker={<span className="mt-[5px] size-3 rounded-full bg-saffron/70" />}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-muted-foreground">Вне меню</div>
          <div className="text-[16px] leading-snug font-semibold">{x.name}</div>
          <MacroLine m={x} className="mt-0.5" />
        </div>
        <button type="button" aria-label={`Убрать: ${x.name}`} onClick={onRemove} className="-mt-1 -mr-2 grid size-11 flex-none place-items-center rounded-xl text-muted-foreground active:bg-surface-2">
          <X className="size-5" aria-hidden />
        </button>
      </div>
    </Row>
  )
}

interface TimelineProps {
  date: ISODate
  today: ISODate
  entries: Partial<Record<Slot, SlotEntry>>
  sources: Record<Slot, MealSource>
  next: Slot | null
  nextTape?: string
  extras: Extra[]
  reminders: Reminder[]
  doneSessions: SessionId[]
  onEat: (s: Slot) => void
  onSkip: (s: Slot) => void
  onUndo: (s: Slot) => void
  onRemoveExtra: (x: Extra) => void
  onAddExtra: () => void
}

/**
 * День по времени: утренняя заготовка, пять приёмов, еда вне меню, вечерняя заготовка
 * и «переложи из морозилки». Ближайший неотмеченный приём раскрыт, съеденные свёрнуты.
 */
export function Timeline(p: TimelineProps) {
  const sessions = p.reminders.filter((r): r is Extract<Reminder, { type: 'session' }> => r.type === 'session')
  const morning = sessions.filter((r) => SESSIONS[r.sid].when === 'morning').map((r) => r.sid)
  const evening = sessions.filter((r) => SESSIONS[r.sid].when === 'evening').map((r) => r.sid)
  const defrost = p.reminders.find((r): r is Extract<Reminder, { type: 'defrost' }> => r.type === 'defrost')
  // Заготовка, отмеченной сегодня, остаётся на таймлайне зелёной.
  const doneMorning = p.doneSessions.filter((sid) => SESSIONS[sid].when === 'morning' && !morning.includes(sid))
  const doneEvening = p.doneSessions.filter((sid) => SESSIONS[sid].when === 'evening' && !evening.includes(sid))

  return (
    <ol aria-label="План дня" className="relative pt-2 before:absolute before:top-4 before:bottom-10 before:left-[59px] before:w-px before:bg-surface-3">
      {[...doneMorning.map((sid) => [sid, true] as const), ...morning.map((sid) => [sid, false] as const)].map(([sid, done]) => (
        <SessionNode key={`s-${sid}`} sid={sid} done={done} />
      ))}
      {SLOTS.map((s) => (
        <MealNode
          key={s.key}
          date={p.date}
          today={p.today}
          slot={s}
          entry={p.entries[s.key]}
          source={p.sources[s.key]}
          isNext={p.next === s.key}
          tape={p.next === s.key ? p.nextTape : undefined}
          onEat={() => p.onEat(s.key)}
          onSkip={() => p.onSkip(s.key)}
          onUndo={() => p.onUndo(s.key)}
        />
      ))}
      {p.extras.map((x) => (
        <ExtraNode key={x.id} x={x} onRemove={() => p.onRemoveExtra(x)} />
      ))}
      {[...doneEvening.map((sid) => [sid, true] as const), ...evening.map((sid) => [sid, false] as const)].map(([sid, done]) => (
        <SessionNode key={`s-${sid}`} sid={sid} done={done} />
      ))}
      {defrost && <DefrostNode items={defrost.items} />}
      {p.date <= p.today && (
      <Row
        marker={
          <span className="grid size-[22px] place-items-center rounded-full border-2 border-dashed border-saffron/60 bg-bg text-saffron-ink">
            <Plus className="size-3" strokeWidth={3} aria-hidden />
          </span>
        }
      >
        <button type="button" onClick={p.onAddExtra} className="-mt-3 -ml-2 h-11 rounded-xl px-2 text-left text-[15px] font-semibold text-saffron-ink active:bg-surface-2">
          Съел что-то не по плану
        </button>
      </Row>
      )}
    </ol>
  )
}
