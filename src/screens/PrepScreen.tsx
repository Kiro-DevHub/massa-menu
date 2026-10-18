import { Check, ChevronRight, Clock3 } from 'lucide-react'
import { Link } from 'wouter'
import { BATCH_NAMES, RECIPES, SESSIONS } from '@/data'
import { TopRow } from '@/components/AppShell'
import { Chip, Eyebrow, PageTitle } from '@/components/common'
import { dateShort, DW_FULL } from '@/logic/dates'
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
    <>
      <TopRow />
      <PageTitle title="Заготовки" sub="Четыре готовки в неделю. Отметь «Заготовка сделана», и контейнеры появятся в холодильнике, а продукты спишутся из кладовки." />
      <div className="mt-5 flex flex-col gap-3">
        {list.map((st, i) => (
          <PrepCard key={st.sid} st={st} first={i === 0 && !st.doneAt} />
        ))}
      </div>
    </>
  )
}

function when(st: PrepStatus) {
  if (st.doneAt) return null
  if (st.inDays === 0) return { tone: 'saffron' as const, text: 'сегодня' }
  if (st.inDays === 1) return { tone: 'neutral' as const, text: 'завтра' }
  return { tone: 'neutral' as const, text: `через ${st.inDays} ${plural(st.inDays, ['день', 'дня', 'дней'])}` }
}

function PrepCard({ st, first }: { st: PrepStatus; first: boolean }) {
  const s = SESSIONS[st.sid]
  const w = when(st)
  return (
    <Link
      href={`/prep/${st.sid}`}
      className={cn(
        'flex items-center gap-3 rounded-2xl border bg-surface p-4 shadow-[var(--shadow-card)] active:bg-surface-2/60',
        first ? 'border-saffron/70' : 'border-line',
        st.doneAt && 'bg-surface/60',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Eyebrow>
            {DW_FULL[s.day]} · {s.when === 'morning' ? 'утро' : 'вечер'}
          </Eyebrow>
          <span className="flex-1" />
          {st.doneAt ? (
            <Chip tone="ok" icon={<Check />}>
              сделано {dateShort(st.doneAt)}
            </Chip>
          ) : (
            w && <Chip tone={w.tone}>{w.text}</Chip>
          )}
        </div>
        <h2 className={cn('mt-1.5 font-display text-[19px] leading-tight font-semibold', st.doneAt && 'text-muted-foreground')}>{s.name}</h2>
        <p className="mt-1.5 text-[14.5px] leading-snug text-muted-foreground">
          {s.makes.map((m) => `${BATCH_NAMES[RECIPES[m.recipe].batch!]} ×${m.n}`).join(' · ')} {s.covers}
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
          <Clock3 className="size-3.5" aria-hidden />
          около {s.time} мин
        </div>
      </div>
      <ChevronRight className="size-5 flex-none text-muted-foreground" aria-hidden />
    </Link>
  )
}
