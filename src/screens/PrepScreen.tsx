import { Check, ChevronRight } from 'lucide-react'
import { Link } from 'wouter'
import { BATCH_NAMES, RECIPES, SESSIONS } from '@/data'
import { Group, ScreenHeader } from '@/components/common'
import { DW, dateShort } from '@/logic/dates'
import { plural } from '@/logic/format'
import { prepOrder, type PrepStatus } from '@/logic/prep'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useToday } from '@/store/hooks'

export default function PrepScreen() {
  const today = useToday()
  const data = useAppStore((s) => s.data)
  const list = prepOrder(data, today)
  return (
    <div className="flex flex-col gap-6">
      <ScreenHeader title="Заготовки" sub="Четыре готовки в неделю. Отметь заготовку сделанной, и контейнеры появятся в холодильнике." />
      <Group aria-label="Заготовки недели">
        {list.map((st, i) => (
          <PrepRow key={st.sid} st={st} first={i === 0 && !st.doneAt} />
        ))}
      </Group>
    </div>
  )
}

function status(st: PrepStatus) {
  if (st.doneAt) return { text: `сделано ${dateShort(st.doneAt)}`, cls: 'text-ok' }
  if (st.inDays === 0) return { text: 'сегодня', cls: 'text-saffron-ink' }
  if (st.inDays === 1) return { text: 'завтра', cls: 'text-ink-2' }
  return { text: `через ${st.inDays} ${plural(st.inDays, ['день', 'дня', 'дней'])}`, cls: 'text-muted-foreground' }
}

function PrepRow({ st, first }: { st: PrepStatus; first: boolean }) {
  const s = SESSIONS[st.sid]
  const stat = status(st)
  return (
    <li>
      <Link href={`/prep/${st.sid}`} className="flex items-center gap-4 py-4 pr-3 pl-4 active:bg-surface-2">
        <div
          className={cn(
            'grid size-14 flex-none place-content-center rounded-[16px] text-center',
            st.doneAt ? 'bg-ok/12 text-ok' : first ? 'bg-saffron text-on-saffron' : 'bg-surface-2 text-ink',
          )}
        >
          {st.doneAt ? (
            <Check className="mx-auto size-6" strokeWidth={2.6} aria-hidden />
          ) : (
            <span className="font-display text-[19px] leading-none font-medium">{DW[s.day]}</span>
          )}
          <span className={cn('mt-1 text-[11.5px] leading-none font-semibold', st.doneAt ? 'sr-only' : 'opacity-75')}>{s.when === 'morning' ? 'утро' : 'вечер'}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn('text-[13px] font-semibold', stat.cls)}>{stat.text}</div>
          <div className={cn('text-[17px] leading-snug font-semibold', st.doneAt && 'text-ink-2')}>{s.name}</div>
          <div className="mt-0.5 text-[13.5px] leading-snug text-muted-foreground">
            {s.makes.map((m) => `${BATCH_NAMES[RECIPES[m.recipe].batch!]} ×${m.n}`).join(', ')} {s.covers}, около {s.time} мин
          </div>
        </div>
        <ChevronRight className="size-5 flex-none text-muted-foreground" aria-hidden />
      </Link>
    </li>
  )
}
