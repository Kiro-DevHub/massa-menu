import { AlertCircle, Check, ChefHat, Clock3, Info, Snowflake } from 'lucide-react'
import { Link } from 'wouter'
import { toast } from 'sonner'
import { BATCH_NAMES, PRODUCTS, RECIPES, SESSIONS, type SessionId } from '@/data'
import { BackLink, Chip, EmptyState, Group, Note, SectionTitle, Tape } from '@/components/common'
import { StepsList } from '@/components/Steps'
import { TABBAR_H } from '@/components/TabBar'
import { Button } from '@/components/ui/button'
import { addDays, dateShort, dayMonth, DW, DW_FULL, relDay, untilDay, weekday } from '@/logic/dates'
import { fmtQ, plural } from '@/logic/format'
import { sessionNeeds } from '@/logic/nutrition'
import { prepStatus } from '@/logic/prep'
import { isTracked } from '@/logic/stock'
import { useAppStore } from '@/store/app-store'
import { useToday } from '@/store/hooks'

export default function SessionScreen({ sid }: { sid: string }) {
  if (!(sid in SESSIONS))
    return (
      <div className="pt-2">
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
  // На скотче — плановая дата готовки (или фактическая, если уже сделано).
  const cookDay = st.doneAt ?? st.planned

  const mark = () => {
    doSession(sid)
    const n = s.makes.reduce((a, m) => a + m.n, 0)
    toast(`Заготовка сделана: ${n} ${plural(n, ['контейнер', 'контейнера', 'контейнеров'])} в холодильнике`, {
      action: { label: 'Отменить', onClick: () => undoSession(today, sid) },
    })
  }

  return (
    <div className="flex flex-col gap-7 pt-2">
      <div>
        <BackLink to="/prep">Заготовки</BackLink>
        <div className="mt-3 text-[14px] font-medium text-muted-foreground">
          {DW_FULL[s.day]}, {s.when === 'morning' ? 'утром' : 'вечером'}
        </div>
        <h1 className="mt-1 text-[27px] leading-[1.12] font-bold tracking-[-0.02em]">{s.name}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip icon={<Clock3 />}>около {s.time} мин</Chip>
          <Chip>{s.covers}</Chip>
          {st.doneAt && (
            <Chip tone="ok" icon={<Check />}>
              сделано {dateShort(st.doneAt)}
            </Chip>
          )}
        </div>
      </div>

      {s.note && <Note icon={<Info />}>{s.note}</Note>}

      <section className="flex flex-col gap-3">
        <SectionTitle>Что получится</SectionTitle>
        <ul className="grid grid-cols-2 gap-3 pt-3">
          {s.makes.map((m) => {
            const key = RECIPES[m.recipe].batch!
            return (
              <li key={m.recipe} className="relative rounded-[20px] bg-surface px-4 pt-7 pb-4 shadow-[var(--shadow-card)] dark:border dark:border-line">
                <Tape className="absolute -top-3.5 left-3 text-[19px]" label={`Подпись на контейнере: ${dayMonth(cookDay)}`}>
                  {DW[weekday(cookDay)]} {dayMonth(cookDay)}
                </Tape>
                <div className="leading-snug font-semibold">{BATCH_NAMES[key]}</div>
                <div className="mt-1 font-display text-[26px] leading-none font-light">×{m.n}</div>
                <div className="mt-2 flex items-center gap-1 text-[13px] text-muted-foreground">
                  {m.freeze ? (
                    <>
                      <Snowflake className="size-3.5 text-ice" aria-hidden />в морозилку
                    </>
                  ) : (
                    `хранится до ${untilDay(today, addDays(cookDay, m.keep))}`
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Понадобится</SectionTitle>
        <Group>
          {needs.map((n) => {
            const p = PRODUCTS[n.id]
            const tracked = isTracked(n.id)
            const have = data.pantry[n.id] ?? 0
            let status: React.ReactNode = null
            if (!tracked) status = data.staples[n.id] === 'low' ? <span className="text-warn">заканчивается</span> : null
            else if (have >= n.q)
              status = (
                <span className="inline-flex items-center gap-1 text-ok">
                  <Check className="size-3.5" strokeWidth={2.6} aria-hidden />
                  есть
                </span>
              )
            else
              status = (
                <span className="inline-flex items-center gap-1 text-warn">
                  <AlertCircle className="size-3.5" aria-hidden />
                  {have > 0 ? `есть только ${fmtQ(have, p.unit)}` : 'нет дома'}
                </span>
              )
            return (
              <li key={n.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-medium">{p.name}</div>
                  {status && <div className="mt-0.5 text-[13.5px]">{status}</div>}
                </div>
                <div className="num flex-none pt-0.5 text-[15px] font-semibold">{n.q ? fmtQ(n.q, p.unit) : ''}</div>
              </li>
            )
          })}
        </Group>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href={`/prep/${sid}/cook`}>
                <ChefHat aria-hidden />
                По шагам
              </Link>
            </Button>
          }
        >
          Порядок действий
        </SectionTitle>
        <StepsList steps={s.steps} stepKey={`s:${sid}`} />
      </section>

      <div
        className="sticky z-10 -mx-4 -mt-2 bg-gradient-to-t from-bg from-60% to-transparent px-4 pt-6 pb-2"
        style={{ bottom: `calc(${TABBAR_H}px + env(safe-area-inset-bottom, 0px))` }}
      >
        {st.doneAt ? (
          <Button variant="outline" size="lg" className="w-full" onClick={() => undoSession(st.doneAt!, sid)}>
            Отменить: заготовка не сделана{st.doneAt !== today ? ` (${relDay(today, st.doneAt)})` : ''}
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={mark}>
            <Check strokeWidth={2.6} aria-hidden />
            Заготовка сделана
          </Button>
        )}
      </div>
    </div>
  )
}
