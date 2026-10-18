import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { CalendarDays, Dumbbell, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SLOTS, TRAIN_DAYS, type Slot } from '@/data'
import { TopRow } from '@/components/AppShell'
import { Chip, MacroLine, SectionTitle } from '@/components/common'
import { addDays, dateLong, DW_FULL, weekday, weekStart } from '@/logic/dates'
import { recipeAt } from '@/logic/menu'
import { nextSlot } from '@/logic/nutrition'
import { dayReminders } from '@/logic/reminders'
import { mealSource } from '@/logic/sources'
import { useAppStore } from '@/store/app-store'
import { useToday } from '@/store/hooks'
import { useUi } from '@/store/ui-store'
import { DayStrip } from './today/DayStrip'
import { ExtraFoodDrawer } from './today/ExtraFoodDrawer'
import { MacroCard } from './today/MacroCard'
import { MealCard } from './today/MealCard'
import { ReminderCard } from './today/ReminderCard'

const SWIPE = 70

export function TodayScreen() {
  const today = useToday()
  const selected = useUi((s) => s.selectedDate) ?? today
  const dir = useUi((s) => s.dayDir)
  const selectDate = useUi((s) => s.selectDate)
  const go = (d: string) => selectDate(d === today ? null : d, d > selected ? 1 : -1)

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) < SWIPE || Math.abs(info.offset.y) > Math.abs(info.offset.x)) return
    go(addDays(selected, info.offset.x < 0 ? 1 : -1))
  }

  return (
    <>
      <div className="sticky top-[env(safe-area-inset-top,0px)] z-20 -mx-4 bg-bg/88 px-4 pb-3 backdrop-blur-xl">
        <TopRow />
        <DayStrip today={today} selected={selected} onSelect={go} />
      </div>

      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div
          key={selected}
          custom={dir}
          variants={{
            enter: (d: number) => ({ x: d * 36, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d * -36, opacity: 0, transition: { duration: 0.12 } }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          dragSnapToOrigin
          onDragEnd={onDragEnd}
          className="touch-pan-y"
        >
          <DayView date={selected} today={today} onToday={() => go(today)} />
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function DayView({ date, today, onToday }: { date: string; today: string; onToday: () => void }) {
  const data = useAppStore((s) => s.data)
  const eat = useAppStore((s) => s.eat)
  const skip = useAppStore((s) => s.skip)
  const undoMeal = useAppStore((s) => s.undoMeal)
  const removeExtra = useAppStore((s) => s.removeExtra)
  const addExtra = useAppStore((s) => s.addExtra)
  const [extraOpen, setExtraOpen] = useState(false)

  const w = weekday(date)
  const L = data.log[date]
  const next = nextSlot(data, today, date)
  const reminders = useMemo(() => dayReminders(data, today, date), [data, today, date])
  const isToday = date === today
  const otherWeek = weekStart(date) !== weekStart(today)

  const onEat = (slot: Slot) => {
    const r = recipeAt(date, slot)
    eat(date, slot)
    navigator.vibrate?.(12)
    toast(`Съел: ${r.name}`, { action: { label: 'Отменить', onClick: () => undoMeal(date, slot) } })
  }
  const onSkip = (slot: Slot) => {
    skip(date, slot)
    toast(`Отмечено: не ел`, { action: { label: 'Отменить', onClick: () => undoMeal(date, slot) } })
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] leading-[1.08] font-semibold tracking-[-0.02em]">{DW_FULL[w]}</h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            {dateLong(date)}
            {isToday ? ' · сегодня' : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {TRAIN_DAYS.includes(w) && (
            <Chip tone="saffron" icon={<Dumbbell />}>
              День зала
            </Chip>
          )}
          {!isToday && (
            <button type="button" onClick={onToday} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-[13.5px] font-semibold">
              <CalendarDays className="size-4" aria-hidden />
              {otherWeek ? 'К сегодня' : 'Сегодня'}
            </button>
          )}
        </div>
      </header>

      <MacroCard date={date} next={next} />

      {reminders.length > 0 && (
        <section aria-label="Напоминания" className="flex flex-col gap-2.5">
          {reminders.map((r, i) => (
            <ReminderCard key={i} r={r} />
          ))}
        </section>
      )}

      <section aria-label="Приёмы пищи" className="flex flex-col gap-3">
        {SLOTS.map((s) => (
          <MealCard
            key={s.key}
            date={date}
            today={today}
            slot={s}
            entry={L?.slots[s.key]}
            source={mealSource(data, today, date, s.key)}
            isNext={next === s.key}
            onEat={() => onEat(s.key)}
            onSkip={() => onSkip(s.key)}
            onUndo={() => undoMeal(date, s.key)}
          />
        ))}
      </section>

      <section aria-label="Вне меню" className="flex flex-col gap-2">
        <SectionTitle
          action={
            <button type="button" onClick={() => setExtraOpen(true)} className="-mr-2 inline-flex h-11 items-center gap-1 rounded-xl px-2 text-[15px] font-semibold text-saffron-ink">
              <Plus className="size-[18px]" aria-hidden />
              Добавить
            </button>
          }
        >
          Вне меню
        </SectionTitle>
        {L?.extras.length ? (
          <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {L.extras.map((x) => (
              <li key={x.id} className="flex items-center gap-3 py-2.5 pr-1.5 pl-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{x.name}</div>
                  <MacroLine m={x} />
                </div>
                <button
                  type="button"
                  aria-label={`Убрать: ${x.name}`}
                  onClick={() => {
                    removeExtra(date, x.id)
                    toast(`Убрано: ${x.name}`, { action: { label: 'Вернуть', onClick: () => addExtra(date, x) } })
                  }}
                  className="grid size-11 place-items-center rounded-xl text-muted-foreground active:bg-surface-2"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14.5px] text-muted-foreground">Съел что-то не по плану, например шаурму у ларька? Добавь, чтобы калории дня были честными.</p>
        )}
      </section>

      <ExtraFoodDrawer date={date} open={extraOpen} onOpenChange={setExtraOpen} />
    </div>
  )
}
