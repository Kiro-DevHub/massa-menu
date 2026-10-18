import { Minus, Plus, Refrigerator, Snowflake } from 'lucide-react'
import { Link } from 'wouter'
import { toast } from 'sonner'
import { BATCH_NAMES, CATEGORIES, PRODUCTS, type ProductId } from '@/data'
import { EmptyState, Group, GroupLabel, ScreenHeader, Tape } from '@/components/common'
import { QtyInput } from '@/components/QtyInput'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dayMonth, DW, relDay, untilDay, weekday, type ISODate } from '@/logic/dates'
import { plural } from '@/logic/format'
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
    <div className="flex flex-col gap-5">
      <ScreenHeader title="Склад" />
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'fridge' | 'pantry')} className="gap-6">
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
    </div>
  )
}

/* ---------- Холодильник: контейнеры на полках, подписанные скотчем ---------- */

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
        Отметь заготовку сделанной, и контейнеры появятся здесь с датой готовки на скотче.
      </EmptyState>
    )
  const rows: FridgeItem[][] = []
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2))
  const portions = items.reduce((a, f) => a + f.n, 0)
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[24px] bg-surface-2/70 px-3 pt-6 pb-1 dark:bg-surface/60">
        {rows.map((row, i) => (
          <div key={i} className="mb-5">
            <div className="grid grid-cols-2 gap-3">
              {row.map((f) => (
                <Tub key={f.id} f={f} today={today} />
              ))}
            </div>
            {/* Стеклянная полка */}
            <div aria-hidden className="-mx-1 mt-2.5 h-1.5 rounded-full bg-gradient-to-b from-white/80 to-surface-3 shadow-[0_2px_4px_rgb(0_0_0/0.08)] dark:from-white/10 dark:to-surface-3" />
          </div>
        ))}
      </div>
      <p className="px-1 text-[13.5px] leading-snug text-muted-foreground">
        {portions} {plural(portions, ['порция', 'порции', 'порций'])}. Съеденное списывается само, когда отмечаешь «Съел». Кнопка «−» нужна, если порцию выбросил или отдал.
      </p>
    </div>
  )
}

function Tub({ f, today }: { f: FridgeItem; today: ISODate }) {
  const adjust = useAppStore((s) => s.adjustFridge)
  const restoreTub = useAppStore((s) => s.restoreTub)
  const name = BATCH_NAMES[f.key]
  const status = f.freeze
    ? { text: 'в морозилке', cls: 'text-ice', icon: <Snowflake className="size-3.5" aria-hidden /> }
    : f.until < today
      ? { text: 'просрочено', cls: 'text-bad', icon: null }
      : f.until === today
        ? { text: 'съесть сегодня', cls: 'text-warn', icon: null }
        : { text: `хранится до ${untilDay(today, f.until)}`, cls: 'text-muted-foreground', icon: null }
  return (
    <div className="relative flex min-w-0 flex-col rounded-[14px_14px_18px_18px] bg-surface px-3.5 pt-8 pb-3 shadow-[var(--shadow-card)] dark:border dark:border-line">
      {/* Крышка */}
      <div aria-hidden className="absolute inset-x-1.5 -top-1.5 h-3 rounded-[8px] bg-surface-3" />
      <Tape className="absolute top-0 left-2.5 max-w-[calc(100%-20px)] truncate text-[20px]" label={`Приготовлено ${dayMonth(f.cooked)}`}>
        {DW[weekday(f.cooked)]} {dayMonth(f.cooked)}
      </Tape>
      <div className="text-[15px] leading-snug font-semibold">{name}</div>
      <div className={cn('mt-1 flex items-center gap-1 text-[12.5px] font-medium', status.cls)}>
        {status.icon}
        {status.text}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          aria-label={`Убрать порцию: ${name}`}
          onClick={() => {
            adjust(f.id, -1)
            if (f.n === 1) toast(`Убрано: ${name}`, { action: { label: 'Вернуть', onClick: () => restoreTub(f) } })
          }}
          className="relative grid size-9 place-items-center rounded-full bg-surface-2 after:absolute after:-inset-1 active:bg-surface-3"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="font-display text-[24px] leading-none font-light">
          ×{f.n}
          <span className="sr-only"> {plural(f.n, ['порция', 'порции', 'порций'])}</span>
        </span>
        <button
          type="button"
          aria-label={`Добавить порцию: ${name}`}
          onClick={() => adjust(f.id, 1)}
          className="relative grid size-9 place-items-center rounded-full bg-surface-2 after:absolute after:-inset-1 active:bg-surface-3"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

/* ---------- Кладовка: сверка количества, прогноз и бакалея ---------- */

function Pantry() {
  const today = useToday()
  const data = useAppStore((s) => s.data)
  const setPantry = useAppStore((s) => s.setPantry)
  const toggleStaple = useAppStore((s) => s.toggleStaple)
  const fc = pantryForecast(data, today)
  const ids = Object.keys(PRODUCTS) as ProductId[]
  const staples = ids.filter((id) => PRODUCTS[id].staple)

  return (
    <div className="flex flex-col gap-6">
      <p className="px-1 text-[14.5px] leading-snug text-muted-foreground">Это и есть сверка: если дома продукта больше или меньше, поправь число.</p>
      {CATEGORIES.map((cat, ci) => {
        const list = ids.filter((id) => PRODUCTS[id].cat === ci && !PRODUCTS[id].staple)
        if (!list.length) return null
        return (
          <section key={cat} className="flex flex-col gap-2">
            <GroupLabel>{cat}</GroupLabel>
            <Group>
              {list.map((id) => {
                const p = PRODUCTS[id]
                const st = fc.status[id]
                const ice = fc.freezer[id]
                return (
                  <li key={id} className="flex items-center gap-3 py-2.5 pr-2.5 pl-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] leading-snug font-medium">{p.name}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[13px] font-medium">
                        {st?.kind === 'shortToday' && <span className="text-bad">не хватает уже сегодня</span>}
                        {st?.kind === 'shortOn' && <span className="text-warn">закончится {relDay(today, st.date)}</span>}
                        {st?.kind === 'enough' && <span className="text-ok">хватит на неделю</span>}
                        {st?.kind === 'unused' && <span className="font-normal text-muted-foreground">на этой неделе не нужен</span>}
                        {ice && (
                          <span className="inline-flex items-center gap-1 text-ice">
                            <Snowflake className="size-3.5" aria-hidden />в морозилку, нужно {relDay(today, ice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <QtyInput value={data.pantry[id] ?? 0} unit={p.unit} label={`${p.name}, сколько дома`} onCommit={(v) => setPantry(id, v)} />
                  </li>
                )
              })}
            </Group>
          </section>
        )
      })}

      <section className="flex flex-col gap-2">
        <GroupLabel>Соусы, специи, бакалея</GroupLabel>
        <Group>
          {staples.map((id) => {
            const low = data.staples[id] === 'low'
            return (
              <li key={id} className="flex min-h-[52px] items-center gap-3 py-1.5 pr-2.5 pl-4">
                <div className="min-w-0 flex-1 text-[16px] font-medium">{PRODUCTS[id].name}</div>
                <button
                  type="button"
                  aria-pressed={low}
                  aria-label={`${PRODUCTS[id].name}: ${low ? 'заканчивается' : 'есть'}`}
                  onClick={() => toggleStaple(id)}
                  className={cn(
                    'relative h-9 min-w-[124px] rounded-full px-3 text-[13.5px] font-semibold transition-colors duration-[175ms] after:absolute after:-inset-y-1 after:inset-x-0',
                    low ? 'bg-warn/14 text-warn' : 'bg-surface-2 text-ink-2',
                  )}
                >
                  {low ? 'заканчивается' : 'есть'}
                </button>
              </li>
            )
          })}
        </Group>
        <p className="px-1 text-[13px] leading-snug text-muted-foreground">Граммы тут не считаем. Нажми, когда что-то кончается, и оно попадёт в покупки.</p>
      </section>
    </div>
  )
}
