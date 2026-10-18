import { AlertCircle, Check, ChefHat, Clock3, Lightbulb, Snowflake } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'wouter'
import { toast } from 'sonner'
import { PRODUCTS, SLOTS, type Recipe, type Slot } from '@/data'
import { BackLink, Card, Chip, EmptyState, Group, Note, SectionTitle, Tape } from '@/components/common'
import { SourceChip } from '@/components/SourceChip'
import { StepsList } from '@/components/Steps'
import { TABBAR_H } from '@/components/TabBar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dayMonth, DW, DW_FULL, weekday, type ISODate } from '@/logic/dates'
import { fmtDuration, fmtQ } from '@/logic/format'
import { recipeAt, recipeIdAt } from '@/logic/menu'
import { mealSource } from '@/logic/sources'
import { isTracked } from '@/logic/stock'
import type { AppData } from '@/logic/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useToday } from '@/store/hooks'

const isSlot = (s: string): s is Slot => SLOTS.some((x) => x.key === s)
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)

export default function RecipeScreen({ date, slot }: { date: string; slot: string }) {
  if (!isDate(date) || !isSlot(slot))
    return (
      <div className="pt-2">
        <BackLink to="/">Сегодня</BackLink>
        <EmptyState icon={<ChefHat />} title="Рецепт не найден" className="mt-4">
          Ссылка устарела. Открой блюдо из плана на экране «Сегодня».
        </EmptyState>
      </div>
    )
  return <RecipeView date={date} slot={slot} />
}

/** Текст разогрева без вводной «Из холодильника:», она уже есть в заголовке карточки. */
const reheatText = (t: string) => {
  const s = t.replace(/^[^:]{0,40}:\s*/, '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Можно ли готовить ×2 впрок: обеды и ужины из заготовок и сырники. */
const canScale = (r: Recipe) => (r.kind === 'm' && !!r.batch) || r.batch === 'syrniki'

function RecipeView({ date, slot }: { date: ISODate; slot: Slot }) {
  const today = useToday()
  const data = useAppStore((s) => s.data)
  const eat = useAppStore((s) => s.eat)
  const undoMeal = useAppStore((s) => s.undoMeal)
  const skip = useAppStore((s) => s.skip)
  const [portions, setPortions] = useState(1)
  const r = recipeAt(date, slot)
  const rid = recipeIdAt(date, slot)
  const sl = SLOTS.find((s) => s.key === slot)!
  const entry = data.log[date]?.slots[slot]
  const mult = canScale(r) ? portions : 1
  const tub = r.batch ? data.fridge.filter((f) => f.key === r.batch).sort((a, b) => (a.cooked < b.cooked ? -1 : 1))[0] : undefined
  const back = date === today ? 'Сегодня' : DW_FULL[weekday(date)]

  return (
    <div className="flex flex-col gap-7 pt-2">
      <div>
        <BackLink to="/">{back}</BackLink>
        <div className="mt-3 text-[14px] font-medium text-muted-foreground">
          {sl.name}, {sl.time}
        </div>
        <h1 className="mt-1 text-[27px] leading-[1.12] font-bold tracking-[-0.02em] text-balance">{r.name}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip icon={<Clock3 />}>{r.time ? fmtDuration(r.time) : 'без готовки'}</Chip>
          {r.batch && <Chip>можно впрок</Chip>}
          {r.fresh && <Chip>только свежим</Chip>}
          <SourceChip src={mealSource(data, today, date, slot)} today={today} />
        </div>

        <div className="mt-6 grid grid-cols-4 divide-x divide-line" aria-label="КБЖУ на порцию">
          <Stat v={r.k} k="ккал" />
          <Stat v={r.p} unit="г" k="белки" className="text-prot" />
          <Stat v={r.f} unit="г" k="жиры" className="text-fat" />
          <Stat v={r.c} unit="г" k="углеводы" className="text-carb" />
        </div>
      </div>

      {tub && r.reheat && (
        <Card className="relative mt-2 px-4 pt-7 pb-4">
          <Tape className="absolute -top-3.5 left-4" label={`Приготовлено ${dayMonth(tub.cooked)}`}>
            {DW[weekday(tub.cooked)]} {dayMonth(tub.cooked)}
          </Tape>
          <div className="flex items-center gap-1.5 text-[14px] font-semibold">
            {tub.freeze ? <Snowflake className="size-4 text-ice" aria-hidden /> : <Check className="size-4 text-ok" aria-hidden />}
            {tub.freeze ? 'Есть в морозилке' : 'Есть в холодильнике'}
          </div>
          <p className="mt-1.5 text-[15px] leading-snug text-ink-2">{reheatText(r.reheat)}</p>
        </Card>
      )}

      <section className="flex flex-col gap-3">
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

      <section className="flex flex-col gap-3">
        <SectionTitle
          action={
            r.steps.length > 1 && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/recipe/${date}/${slot}/cook`}>
                  <ChefHat aria-hidden />
                  По шагам
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
        <Note key={t} icon={<Lightbulb />}>
          {t}
        </Note>
      ))}

      {date <= today && (
        <div
          className="sticky z-10 -mx-4 -mt-2 bg-gradient-to-t from-bg from-60% to-transparent px-4 pt-6 pb-2"
          style={{ bottom: `calc(${TABBAR_H}px + env(safe-area-inset-bottom, 0px))` }}
        >
          {entry ? (
            <Button variant="outline" size="lg" className="w-full" onClick={() => undoMeal(date, slot)}>
              Отменить отметку «{entry.st === 'eaten' ? 'съел' : 'не ел'}»
            </Button>
          ) : (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Button
                size="lg"
                onClick={() => {
                  eat(date, slot)
                  toast(`Съел: ${r.name}`, { action: { label: 'Отменить', onClick: () => undoMeal(date, slot) } })
                }}
              >
                <Check strokeWidth={2.6} aria-hidden />
                Съел
              </Button>
              <Button size="lg" variant="secondary" className="px-5" onClick={() => skip(date, slot)}>
                Не ел
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ v, k, unit, className }: { v: number; k: string; unit?: string; className?: string }) {
  return (
    <div className="px-3 first:pl-0">
      <div className={cn('font-display text-[24px] leading-none font-light tracking-[-0.03em]', className)}>
        {v}
        {unit && <span className="ml-1 font-sans text-[13px] font-medium">{unit}</span>}
      </div>
      <div className="mt-1.5 text-[12.5px] text-muted-foreground">{k}</div>
    </div>
  )
}

function Ingredients({ r, mult, data }: { r: Recipe; mult: number; data: AppData }) {
  return (
    <Group>
      {r.ing.map((i) => {
        const p = PRODUCTS[i.id]
        const q = i.q * mult
        const have = data.pantry[i.id] ?? 0
        let status: React.ReactNode = null
        if (i.pre)
          status = (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Snowflake className="size-3.5" aria-hidden />
              подготовлено заранее
            </span>
          )
        else if (!isTracked(i.id)) status = data.staples[i.id] === 'low' ? <span className="text-warn">заканчивается</span> : null
        else if (have >= q)
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
          <li key={i.id} className="flex items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-medium">{p.name}</div>
              {(i.note || status) && (
                <div className="mt-0.5 flex flex-wrap gap-x-2.5 text-[13.5px] text-muted-foreground">
                  {status}
                  {i.note && <span>{i.note}</span>}
                </div>
              )}
            </div>
            <div className="num flex-none pt-0.5 text-[15px] font-semibold">{q ? fmtQ(q, p.unit ?? 'г') : ''}</div>
          </li>
        )
      })}
    </Group>
  )
}
