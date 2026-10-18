import { ChefHat, Clock3, Snowflake } from 'lucide-react'
import { Link } from 'wouter'
import { toast } from 'sonner'
import { BATCH_NAMES, PRODUCTS, RECIPES, SESSIONS, type SessionId } from '@/data'
import { BackLink, Chip, EmptyState, Eyebrow, Note, SectionTitle } from '@/components/common'
import { StepsList } from '@/components/Steps'
import { TABBAR_H } from '@/components/TabBar'
import { Button } from '@/components/ui/button'
import { addDays, dateShort, DW_FULL, relDay, untilDay } from '@/logic/dates'
import { fmtQ } from '@/logic/format'
import { sessionNeeds } from '@/logic/nutrition'
import { prepStatus } from '@/logic/prep'
import { isTracked } from '@/logic/stock'
import { useAppStore } from '@/store/app-store'
import { useToday } from '@/store/hooks'

export default function SessionScreen({ sid }: { sid: string }) {
  if (!(sid in SESSIONS))
    return (
      <div className="pt-4">
        <BackLink to="/prep">Заготовки</BackLink>
        <EmptyState icon={<ChefHat />} title="Заготовка не найдена" className="mt-4">
          Открой её из списка заготовок.
        </EmptyState>
      </div>
    )
  return <SessionView sid={sid as SessionId} />
}

function SessionView({ sid }: { sid: SessionId }) {
  const today = useToday()
  const data = useAppStore((s) => s.data)
  const doSession = useAppStore((s) => s.doSession)
  const undoSession = useAppStore((s) => s.undoSession)
  const s = SESSIONS[sid]
  const st = prepStatus(data, today, sid)
  const needs = sessionNeeds(sid)
  const lowStaples = needs.filter((n) => !isTracked(n.id) && data.staples[n.id] === 'low')

  const mark = () => {
    doSession(sid)
    const n = s.makes.reduce((a, m) => a + m.n, 0)
    toast(`Заготовка сделана: +${n} контейнера`, { action: { label: 'Отменить', onClick: () => undoSession(today, sid) } })
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div>
        <BackLink to="/prep">Заготовки</BackLink>
        <Eyebrow className="mt-2">
          {DW_FULL[s.day]} · {s.when === 'morning' ? 'утро' : 'вечер'}
        </Eyebrow>
        <h1 className="mt-1.5 font-display text-[26px] leading-[1.12] font-semibold tracking-[-0.02em]">{s.name}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip icon={<Clock3 />}>около {s.time} мин</Chip>
          <Chip>{s.covers}</Chip>
          {st.doneAt && <Chip tone="ok">сделано {dateShort(st.doneAt)}</Chip>}
        </div>
      </div>

      {s.note && <Note>{s.note}</Note>}

      <section className="flex flex-col gap-2.5">
        <SectionTitle>Что получится</SectionTitle>
        <ul className="grid grid-cols-2 gap-2">
          {s.makes.map((m) => {
            const key = RECIPES[m.recipe].batch!
            return (
              <li key={m.recipe} className="rounded-2xl border border-line bg-surface p-3">
                <div className="font-display text-[22px] leading-none font-semibold">×{m.n}</div>
                <div className="mt-1.5 leading-snug font-semibold">{BATCH_NAMES[key]}</div>
                <div className="mt-1 flex items-center gap-1 text-[13px] text-muted-foreground">
                  {m.freeze ? (
                    <>
                      <Snowflake className="size-3.5 text-ice" aria-hidden />в морозилку
                    </>
                  ) : (
                    `хранится ${m.keep} дня, до ${untilDay(today, addDays(today, m.keep))}`
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-2.5">
        <SectionTitle>Понадобится</SectionTitle>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {needs.map((n) => {
            const p = PRODUCTS[n.id]
            const tracked = isTracked(n.id)
            const have = data.pantry[n.id] ?? 0
            let status: React.ReactNode = null
            if (!tracked) status = data.staples[n.id] === 'low' ? <span className="text-warn">заканчивается</span> : null
            else if (have >= n.q) status = <span className="text-ok">есть</span>
            else if (have > 0) status = <span className="text-warn">есть только {fmtQ(have, p.unit)}</span>
            else status = <span className="text-warn">не хватает</span>
            return (
              <li key={n.id} className="flex items-baseline gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{p.name}</div>
                  <div className="mt-0.5 text-[13.5px] text-muted-foreground">{status}</div>
                </div>
                <div className="num flex-none font-semibold">{n.q ? fmtQ(n.q, p.unit) : ''}</div>
              </li>
            )
          })}
        </ul>
        {lowStaples.length > 0 && <p className="text-[14px] text-warn">Отмечено «заканчивается»: проверь, хватит ли на эту заготовку.</p>}
      </section>

      <section className="flex flex-col gap-2.5">
        <SectionTitle
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href={`/prep/${sid}/cook`}>
                <ChefHat aria-hidden />
                Режим готовки
              </Link>
            </Button>
          }
        >
          Порядок действий
        </SectionTitle>
        <StepsList steps={s.steps} stepKey={`s:${sid}`} />
      </section>

      <div className="sticky z-10 -mx-4 mt-1 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pt-4 pb-2" style={{ bottom: `calc(${TABBAR_H}px + env(safe-area-inset-bottom, 0px))` }}>
        {st.doneAt ? (
          <Button variant="outline" size="lg" className="w-full" onClick={() => undoSession(st.doneAt!, sid)}>
            Отменить: заготовка не сделана {st.doneAt !== today ? `(${relDay(today, st.doneAt)})` : ''}
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={mark}>
            Заготовка сделана
          </Button>
        )}
      </div>
    </div>
  )
}
