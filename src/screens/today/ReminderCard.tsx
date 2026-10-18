import { CalendarClock, ChefHat, Snowflake, Trash2, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'wouter'
import { BATCH_NAMES, PRODUCTS, RECIPES, SESSIONS } from '@/data'
import { fmtQ } from '@/logic/format'
import type { Reminder } from '@/logic/reminders'
import type { FridgeItem } from '@/logic/types'
import { cn } from '@/lib/utils'

const tubs = (items: FridgeItem[]) => items.map((f) => `${BATCH_NAMES[f.key]} ×${f.n}`).join(', ')

type Tone = 'saffron' | 'warn' | 'ice' | 'bad'
const TONE: Record<Tone, string> = {
  saffron: 'bg-saffron/16 text-saffron-ink',
  warn: 'bg-warn/15 text-warn',
  ice: 'bg-ice/15 text-ice',
  bad: 'bg-bad/14 text-bad',
}

function Shell({ tone, icon, title, children, action }: { tone: Tone; icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3 pr-3.5 shadow-[var(--shadow-card)]">
      <div className={cn('grid size-10 flex-none place-items-center rounded-xl [&_svg]:size-5', TONE[tone])}>{icon}</div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="text-[15.5px] leading-snug font-semibold">{title}</div>
        <p className="mt-0.5 text-[14px] leading-snug text-muted-foreground">{children}</p>
      </div>
      {action}
    </div>
  )
}

const openBtn = 'inline-flex h-10 flex-none items-center self-center rounded-[10px] bg-surface-2 px-3.5 text-[14px] font-semibold active:bg-surface-3'

export function ReminderCard({ r }: { r: Reminder }) {
  switch (r.type) {
    case 'session': {
      const s = SESSIONS[r.sid]
      const when = s.when === 'morning' ? 'утром' : 'вечером'
      return (
        <Shell
          tone="saffron"
          icon={<ChefHat />}
          title={r.today ? `Сегодня ${when} заготовка: ${s.name}` : `${when === 'утром' ? 'Утром' : 'Вечером'} заготовка: ${s.name}`}
          action={
            <Link href={`/prep/${r.sid}`} className={openBtn}>
              План
            </Link>
          }
        >
          {s.makes.map((m) => `${BATCH_NAMES[RECIPES[m.recipe].batch!]} ×${m.n}`).join(', ')} {s.covers}, около {s.time} мин.
        </Shell>
      )
    }
    case 'missedSession': {
      const s = SESSIONS[r.sid]
      return (
        <Shell
          tone="warn"
          icon={<TriangleAlert />}
          title={`Заготовка «${s.name}» не сделана`}
          action={
            <Link href={`/prep/${r.sid}`} className={openBtn}>
              План
            </Link>
          }
        >
          Сегодня в меню блюда из неё, а в холодильнике пусто. Сделай её сейчас или готовь эти блюда свежими.
        </Shell>
      )
    }
    case 'defrost':
      return (
        <Shell tone="ice" icon={<Snowflake />} title="Вечером переложи из морозилки в холодильник">
          {r.items.map((i) => `${PRODUCTS[i.id].name} ${fmtQ(i.q, PRODUCTS[i.id].unit)}`).join(', ')}. Это на завтра, за ночь разморозится.
        </Shell>
      )
    case 'expired':
      return (
        <Shell
          tone="bad"
          icon={<Trash2 />}
          title="Просрочено в холодильнике"
          action={
            <Link href="/stock" className={openBtn}>
              Склад
            </Link>
          }
        >
          {tubs(r.items)}. Лучше выбросить и убрать со склада кнопкой «−1».
        </Shell>
      )
    case 'eatToday':
      return (
        <Shell tone="warn" icon={<CalendarClock />} title="Съесть сегодня">
          {tubs(r.items)}: последний день хранения.
        </Shell>
      )
  }
}
