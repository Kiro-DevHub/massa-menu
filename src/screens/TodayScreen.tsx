import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { Settings2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { toast } from 'sonner'
import { SLOTS, type SessionId, type Slot } from '@/data'
import { addDays, dateLong, DW_FULL, weekday } from '@/logic/dates'
import { recipeAt } from '@/logic/menu'
import { nextSlot } from '@/logic/nutrition'
import { dayReminders } from '@/logic/reminders'
import { mealSource, type MealSource } from '@/logic/sources'
import { useAppStore } from '@/store/app-store'
import { useToday } from '@/store/hooks'
import { useUi } from '@/store/ui-store'
import { DayHero } from './today/DayHero'
import { ExtraFoodDrawer } from './today/ExtraFoodDrawer'
import { Notices } from './today/Notices'
import { Timeline } from './today/Timeline'
import { WeekRuler } from './today/WeekRuler'

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
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-20 -mx-4 bg-bg/85 px-4 pb-2 backdrop-blur-xl backdrop-saturate-150">
        <div className="flex h-12 items-center gap-2">
          <h1 className="min-w-0 flex-1 truncate text-[16px] font-semibold">
            {DW_FULL[weekday(selected)]}, {dateLong(selected)}
          </h1>
          {selected !== today && (
            <button type="button" onClick={() => go(today)} className="h-9 rounded-full bg-surface-2 px-3 text-[13.5px] font-semibold active:bg-surface-3">
              К сегодня
            </button>
          )}
          <Link href="/settings" aria-label="Настройки" className="-mr-2.5 grid size-11 place-items-center rounded-xl text-muted-foreground active:bg-surface-2">
            <Settings2 className="size-[22px]" aria-hidden />
          </Link>
        </div>
        <WeekRuler today={today} selected={selected} onSelect={go} />
      </header>

      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div
          key={selected}
          custom={dir}
          variants={{
            enter: (d: number) => ({ x: d * 28, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d * -28, opacity: 0, transition: { duration: 0.13 } }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.31, ease: [0.24, 1, 0.4, 1] }}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          dragSnapToOrigin
          onDragEnd={onDragEnd}
          className="touch-pan-y"
        >
          <DayView date={selected} today={today} />
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function DayView({ date, today }: { date: string; today: string }) {
  const data = useAppStore((s) => s.data)
  const eat = useAppStore((s) => s.eat)
  const skip = useAppStore((s) => s.skip)
  const undoMeal = useAppStore((s) => s.undoMeal)
  const removeExtra = useAppStore((s) => s.removeExtra)
  const addExtra = useAppStore((s) => s.addExtra)
  const [extraOpen, setExtraOpen] = useState(false)

  const L = data.log[date]
  const reminders = useMemo(() => dayReminders(data, today, date), [data, today, date])
  const sources = Object.fromEntries(SLOTS.map((s) => [s.key, mealSource(data, today, date, s.key)])) as Record<Slot, MealSource>

  const onEat = (slot: Slot) => {
    const r = recipeAt(date, slot)
    eat(date, slot)
    navigator.vibrate?.(12)
    toast(`Съел: ${r.name}`, { action: { label: 'Отменить', onClick: () => undoMeal(date, slot) } })
  }
  const onSkip = (slot: Slot) => {
    skip(date, slot)
    toast('Отмечено: не ел', { action: { label: 'Отменить', onClick: () => undoMeal(date, slot) } })
  }

  return (
    <div className="flex flex-col gap-6">
      <DayHero date={date} />
      {date === today && <Notices items={reminders} />}
      <Timeline
        date={date}
        today={today}
        entries={L?.slots ?? {}}
        sources={sources}
        next={nextSlot(data, today, date)}
        extras={L?.extras ?? []}
        reminders={reminders}
        doneSessions={Object.keys(L?.sessions ?? {}) as SessionId[]}
        onEat={onEat}
        onSkip={onSkip}
        onUndo={(s) => undoMeal(date, s)}
        onRemoveExtra={(x) => {
          removeExtra(date, x.id)
          toast(`Убрано: ${x.name}`, { action: { label: 'Вернуть', onClick: () => addExtra(date, x) } })
        }}
        onAddExtra={() => setExtraOpen(true)}
      />
      <ExtraFoodDrawer date={date} open={extraOpen} onOpenChange={setExtraOpen} />
    </div>
  )
}
