import { Minus, Plus, Refrigerator, Snowflake } from 'lucide-react'
import { Link } from 'wouter'
import { toast } from 'sonner'
import { BATCH_NAMES, CATEGORIES, PRODUCTS, type ProductId } from '@/data'
import { TopRow } from '@/components/AppShell'
import { Chip, EmptyState, Eyebrow, PageTitle } from '@/components/common'
import { QtyInput } from '@/components/QtyInput'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dayMonth, DW, relDay, untilDay, weekday, type ISODate } from '@/logic/dates'
import { pantryForecast } from '@/logic/shopping'
import type { FridgeItem } from '@/logic/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useToday } from '@/store/hooks'
import { useUi } from '@/store/ui-store'

export default function StockScreen() {
  const tab = useUi((s) => s.stockTab)
  const setTab = useUi((s) => s.setStockTab)
  return (
    <>
      <TopRow />
      <PageTitle title="Склад" />
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'fridge' | 'pantry')} className="mt-4">
        <TabsList>
          <TabsTrigger value="fridge">Холодильник</TabsTrigger>
          <TabsTrigger value="pantry">Кладовка</TabsTrigger>
        </TabsList>
        <TabsContent value="fridge">
          <Fridge />
        </TabsContent>
        <TabsContent value="pantry">
          <Pantry />
        </TabsContent>
      </Tabs>
    </>
  )
}

/* ---------- Холодильник ---------- */

function Fridge() {
  const today = useToday()
  const fridge = useAppStore((s) => s.data.fridge)
  const items = [...fridge].sort((a, b) => (a.freeze !== b.freeze ? (a.freeze ? 1 : -1) : a.until < b.until ? -1 : 1))
  if (!items.length)
    return (
      <EmptyState
        icon={<Refrigerator />}
        title="Готовых контейнеров нет"
        action={
          <Button asChild variant="secondary">
            <Link href="/prep">К заготовкам</Link>
          </Button>
        }
      >
        Сделай заготовку и отметь её, и контейнеры появятся здесь с датой готовки на скотче.
      </EmptyState>
    )
  const rows: FridgeItem[][] = []
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2))
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[22px] border border-line bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-2)_70%,transparent),transparent_120px)] px-3 pt-5 pb-2">
        {rows.map((row, i) => (
          <div key={i} className="mb-3">
            <div className="grid grid-cols-2 items-end gap-3 px-1">
              {row.map((f) => (
                <Tub key={f.id} f={f} today={today} />
              ))}
            </div>
            {/* Полка */}
            <div aria-hidden className="mt-2 h-2 rounded-full bg-surface-3 shadow-[0_3px_0_rgb(0_0_0/0.12)]" />
          </div>
        ))}
      </div>
      <p className="text-[13.5px] text-muted-foreground">«−1» — если выбросил или отдал порцию. Съеденное списывается само, когда отмечаешь «Съел».</p>
    </div>
  )
}

function Tub({ f, today }: { f: FridgeItem; today: ISODate }) {
  const adjust = useAppStore((s) => s.adjustFridge)
  const restoreTub = useAppStore((s) => s.restoreTub)
  const status = f.freeze ? (
    <Chip tone="ice" icon={<Snowflake />}>
      морозилка
    </Chip>
  ) : f.until < today ? (
    <Chip tone="bad">просрочено</Chip>
  ) : f.until === today ? (
    <Chip tone="warn">съесть сегодня</Chip>
  ) : (
    <Chip tone="ok">до {untilDay(today, f.until)}</Chip>
  )
  const name = BATCH_NAMES[f.key]
  return (
    <div className="relative flex min-w-0 flex-col gap-2 rounded-[18px_18px_14px_14px] border border-line bg-surface px-3 pt-7 pb-3 shadow-[var(--shadow-card)]">
      {/* Крышка */}
      <div aria-hidden className="absolute inset-x-2 -top-[5px] h-[9px] rounded-t-[10px] rounded-b-[3px] border border-line bg-surface-2" />
      <div
        className="tape absolute top-1 left-2.5 max-w-[calc(100%-20px)] -rotate-[2.5deg] truncate px-3 pt-0.5 text-[21px] leading-[1.15] font-bold"
        aria-label={`Приготовлено ${dayMonth(f.cooked)}`}
      >
        {DW[weekday(f.cooked)]} {dayMonth(f.cooked)}
      </div>
      <div className="mt-2 leading-snug font-semibold">{name}</div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-[22px] leading-none font-semibold">×{f.n}</span>
        {status}
      </div>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-label={`Убрать одну порцию: ${name}`}
          onClick={() => {
            adjust(f.id, -1)
            if (f.n === 1) toast(`Убрано: ${name}`, { action: { label: 'Вернуть', onClick: () => restoreTub(f) } })
          }}
          className="grid h-11 place-items-center rounded-xl bg-surface-2 active:bg-surface-3"
        >
          <Minus className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={`Добавить порцию: ${name}`}
          onClick={() => adjust(f.id, 1)}
          className="grid h-11 place-items-center rounded-xl bg-surface-2 active:bg-surface-3"
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  )
}

/* ---------- Кладовка ---------- */

function Pantry() {
  const today = useToday()
  const data = useAppStore((s) => s.data)
  const setPantry = useAppStore((s) => s.setPantry)
  const toggleStaple = useAppStore((s) => s.toggleStaple)
  const fc = pantryForecast(data, today)
  const ids = Object.keys(PRODUCTS) as ProductId[]
  const staples = ids.filter((id) => PRODUCTS[id].staple)

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14.5px] text-muted-foreground">Это и есть сверка: если дома продукта больше или меньше, просто поправь число.</p>
      {CATEGORIES.map((cat, ci) => {
        const list = ids.filter((id) => PRODUCTS[id].cat === ci && !PRODUCTS[id].staple)
        if (!list.length) return null
        return (
          <section key={cat} className="flex flex-col gap-2">
            <Eyebrow>{cat}</Eyebrow>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {list.map((id) => {
                const p = PRODUCTS[id]
                const st = fc.status[id]
                const ice = fc.freezer[id]
                return (
                  <li key={id} className="flex items-center gap-3 py-2 pr-2 pl-4">
                    <div className="min-w-0 flex-1 py-1">
                      <div className="leading-snug font-semibold">{p.name}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px]">
                        {st?.kind === 'shortToday' && <span className="text-bad">не хватает уже сегодня</span>}
                        {st?.kind === 'shortOn' && <span className="text-warn">закончится {relDay(today, st.date)}</span>}
                        {st?.kind === 'enough' && <span className="text-ok">хватит на неделю</span>}
                        {st?.kind === 'unused' && <span className="text-muted-foreground">на этой неделе не нужен</span>}
                        {ice && (
                          <Chip tone="ice" icon={<Snowflake />}>
                            в морозилку · нужно {relDay(today, ice)}
                          </Chip>
                        )}
                      </div>
                    </div>
                    <QtyInput value={data.pantry[id] ?? 0} unit={p.unit} label={`${p.name}, сколько дома`} onCommit={(v) => setPantry(id, v)} />
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      <section className="flex flex-col gap-2">
        <Eyebrow>Соусы, специи, бакалея</Eyebrow>
        <p className="text-[13.5px] text-muted-foreground">Граммы тут не считаем. Нажми, когда что-то кончается, и оно попадёт в покупки.</p>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {staples.map((id) => {
            const low = data.staples[id] === 'low'
            return (
              <li key={id} className="flex min-h-14 items-center gap-3 py-1.5 pr-2 pl-4">
                <div className="min-w-0 flex-1 font-semibold">{PRODUCTS[id].name}</div>
                <button
                  type="button"
                  aria-pressed={low}
                  aria-label={`${PRODUCTS[id].name}: ${low ? 'заканчивается' : 'есть'}`}
                  onClick={() => toggleStaple(id)}
                  className={cn(
                    'h-11 min-w-[132px] rounded-xl px-3 text-[14px] font-semibold transition-colors',
                    low ? 'bg-warn/15 text-warn' : 'bg-surface-2 text-ink-2',
                  )}
                >
                  {low ? 'заканчивается' : 'есть'}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
