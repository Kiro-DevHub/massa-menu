import { CalendarClock, ChevronRight, Trash2, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'wouter'
import { BATCH_NAMES, SESSIONS } from '@/data'
import type { Reminder } from '@/logic/reminders'
import type { FridgeItem } from '@/logic/types'
import { cn } from '@/lib/utils'

const tubs = (items: FridgeItem[]) => items.map((f) => `${BATCH_NAMES[f.key]} ×${f.n}`).join(', ')

/** Что требует внимания сегодня, но не привязано ко времени. Одна группа строк, а не стопка карточек. */
export function Notices({ items }: { items: Reminder[] }) {
  const rows: { key: string; tone: string; icon: ReactNode; title: string; body: string; to: string }[] = []
  for (const r of items) {
    if (r.type === 'missedSession')
      rows.push({
        key: `m-${r.sid}`,
        tone: 'text-warn bg-warn/14',
        icon: <TriangleAlert />,
        title: `Не сделана заготовка «${SESSIONS[r.sid].name}»`,
        body: 'Блюд из неё нет в холодильнике. Сделай её сейчас или готовь эти блюда свежими.',
        to: `/prep/${r.sid}`,
      })
    if (r.type === 'expired')
      rows.push({ key: 'exp', tone: 'text-bad bg-bad/14', icon: <Trash2 />, title: 'Просрочено, лучше выбросить', body: tubs(r.items), to: '/stock' })
    if (r.type === 'eatToday')
      rows.push({ key: 'last', tone: 'text-warn bg-warn/14', icon: <CalendarClock />, title: 'Последний день хранения', body: tubs(r.items), to: '/stock' })
  }
  if (!rows.length) return null
  return (
    <ul aria-label="Требует внимания" className="divide-y divide-line overflow-hidden rounded-[20px] bg-surface dark:border dark:border-line">
      {rows.map((r) => (
        <li key={r.key}>
          <Link href={r.to} className="flex min-h-14 items-center gap-3 py-3 pr-3 pl-3.5 active:bg-surface-2">
            <span className={cn('grid size-9 flex-none place-items-center rounded-full [&_svg]:size-[18px]', r.tone)}>{r.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] leading-snug font-semibold">{r.title}</span>
              <span className="mt-0.5 block text-[13.5px] leading-snug text-muted-foreground">{r.body}</span>
            </span>
            <ChevronRight className="size-5 flex-none text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  )
}
