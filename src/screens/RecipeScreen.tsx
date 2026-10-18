import { ChefHat, Clock3, Snowflake } from 'lucide-react'
import { Link } from 'wouter'
import { toast } from 'sonner'
import { PRODUCTS, SLOTS, type Recipe, type Slot } from '@/data'
import { BackLink, Chip, EmptyState, Eyebrow, Note, SectionTitle } from '@/components/common'
import { SourceChip } from '@/components/SourceChip'
import { StepsList } from '@/components/Steps'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DW_FULL, weekday, type ISODate } from '@/logic/dates'
import { fmtDuration, fmtQ } from '@/logic/format'
import { recipeAt, recipeIdAt } from '@/logic/menu'
import { mealSource } from '@/logic/sources'
import { fridgeCount, isTracked } from '@/logic/stock'
import type { AppData } from '@/logic/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useToday } from '@/store/hooks'
import { useState } from 'react'
import { TABBAR_H } from '@/components/TabBar'

const isSlot = (s: string): s is Slot => SLOTS.some((x) => x.key === s)
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)

export default function RecipeScreen({ date, slot }: { date: string; slot: string }) {
  if (!isDate(date) || !isSlot(slot))
    return (
      <div className="pt-4">
        <BackLink to="/">Сегодня</BackLink>
        <EmptyState icon={<ChefHat />} title="Рецепт не найден" className="mt-4">
          Ссылка устарела. Открой блюдо из списка на экране «Сегодня».
        </EmptyState>
      </div>
    )
  return <RecipeView date={date} slot={slot} />
}

/** Можно ли готовить ×2 впрок: обеды и ужины из заготовок и сырники. */
const canScale = (r: Recipe) => (r.kind === 'm' && !!r.batch) || r.batch === 'syrniki'

function RecipeView({ date, slot }: { date: ISODate; slot: Slot }) {
  const today = useToday()
  const data = useAppStore((s) => s.data)
  const eat = useAppStore((s) => s.eat)
  const undoMeal = useAppStore((s) => s.undoMeal)
  const [portions, setPortions] = useState(1)
  const r = recipeAt(date, slot)
  const rid = recipeIdAt(date, slot)
  const sl = SLOTS.find((s) => s.key === slot)!
  const entry = data.log[date]?.slots[slot]
  const mult = canScale(r) ? portions : 1
  const inFridge = !!r.batch && fridgeCount(data.fridge, r.batch) > 0
  const back = date === today ? 'Сегодня' : DW_FULL[weekday(date)]

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div>
        <BackLink to="/">{back}</BackLink>
        <Eyebrow className="mt-2">
          {sl.name} · {sl.time}
        </Eyebrow>
        <h1 className="mt-1.5 font-display text-[26px] leading-[1.12] font-semibold tracking-[-0.02em]">{r.name}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip icon={<Clock3 />}>{r.time ? fmtDuration(r.time) : 'без готовки'}</Chip>
          {r.batch && <Chip>можно впрок</Chip>}
          {r.fresh && <Chip>готовить свежим</Chip>}
          <SourceChip src={mealSource(data, today, date, slot)} today={today} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2" aria-label="КБЖУ на порцию">
        <Macro v={r.k} k="ккал" />
        <Macro v={r.p} k="белки, г" className="text-prot" />
        <Macro v={r.f} k="жиры, г" className="text-fat" />
        <Macro v={r.c} k="углев., г" className="text-carb" />
      </div>

      {inFridge && r.reheat && (
        <Note tone={r.batch === 'syrniki' ? 'ice' : 'saffron'}>
          <span className="font-semibold">{r.batch === 'syrniki' ? 'Есть в морозилке. ' : 'Есть в холодильнике. '}</span>
          {r.reheat}
        </Note>
      )}

      <section className="flex flex-col gap-2.5">
        <SectionTitle>Ингредиенты</SectionTitle>
        {canScale(r) && (
          <Tabs value={String(portions)} onValueChange={(v) => setPortions(Number(v))}>
            <TabsList aria-label="Сколько готовить">
              <TabsTrigger value="1">1 порция</TabsTrigger>
              <TabsTrigger value="2">×2 впрок</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <Ingredients r={r} mult={mult} data={data} />
      </section>

      <section className="flex flex-col gap-2.5">
        <SectionTitle
          action={
            r.steps.length > 1 && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/recipe/${date}/${slot}/cook`}>
                  <ChefHat aria-hidden />
                  Режим готовки
                </Link>
              </Button>
            )
          }
        >
          Как готовить
        </SectionTitle>
        <StepsList steps={r.steps} stepKey={`r:${rid}`} />
      </section>

      {r.tips?.map((t) => (
        <Note key={t}>{t}</Note>
      ))}

      {date <= today && (
        <div className="sticky z-10 -mx-4 mt-1 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pt-4 pb-2" style={{ bottom: `calc(${TABBAR_H}px + env(safe-area-inset-bottom, 0px))` }}>
          {entry ? (
            <Button variant="outline" size="lg" className="w-full" onClick={() => undoMeal(date, slot)}>
              Отменить отметку «{entry.st === 'eaten' ? 'съел' : 'не ел'}»
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                eat(date, slot)
                toast(`Съел: ${r.name}`, { action: { label: 'Отменить', onClick: () => undoMeal(date, slot) } })
              }}
            >
              Съел
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function Macro({ v, k, className }: { v: number; k: string; className?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-2.5 py-2.5">
      <div className={cn('font-display text-[19px] leading-tight font-semibold', className)}>{v}</div>
      <div className="mt-0.5 text-[12px] text-muted-foreground">{k}</div>
    </div>
  )
}

function Ingredients({ r, mult, data }: { r: Recipe; mult: number; data: AppData }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {r.ing.map((i) => {
        const p = PRODUCTS[i.id]
        const q = i.q * mult
        const have = data.pantry[i.id] ?? 0
        let status: React.ReactNode = null
        if (i.pre) status = <span className="inline-flex items-center gap-1 text-muted-foreground"><Snowflake className="size-3.5" aria-hidden />заготовлено заранее</span>
        else if (!isTracked(i.id)) status = data.staples[i.id] === 'low' ? <span className="text-warn">заканчивается</span> : null
        else if (have >= q) status = <span className="text-ok">есть</span>
        else if (have > 0) status = <span className="text-warn">есть только {fmtQ(have, p.unit)}</span>
        else status = <span className="text-warn">не хватает</span>
        return (
          <li key={i.id} className="flex items-baseline gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="font-medium">{p.name}</div>
              {(i.note || status) && (
                <div className="mt-0.5 flex flex-wrap gap-x-2 text-[13.5px] text-muted-foreground">
                  {status}
                  {i.note && <span>{i.note}</span>}
                </div>
              )}
            </div>
            <div className="num flex-none font-semibold">{q ? fmtQ(q, p.unit ?? (p.staple ? 'г' : undefined)) : ''}</div>
          </li>
        )
      })}
    </ul>
  )
}
