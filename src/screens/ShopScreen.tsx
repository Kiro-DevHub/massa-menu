import { ShoppingBag, Snowflake, Undo2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PRODUCTS, type ProductId } from '@/data'
import { TopRow } from '@/components/AppShell'
import { Chip, EmptyState, Eyebrow, Note, PageTitle, SectionTitle } from '@/components/common'
import { QtyInput } from '@/components/QtyInput'
import { Button } from '@/components/ui/button'
import { addDays, dateLong, relDay, untilDay, type ISODate } from '@/logic/dates'
import { fmtQ } from '@/logic/format'
import { roundBuy, shopFreezerHint, shopping, type Shopping } from '@/logic/shopping'
import { useAppStore } from '@/store/app-store'
import { useToday } from '@/store/hooks'

const byCategory = (ids: ProductId[]) => ids.sort((a, b) => PRODUCTS[a].cat - PRODUCTS[b].cat)

export default function ShopScreen() {
  const today = useToday()
  const data = useAppStore((s) => s.data)
  const unbuy = useAppStore((s) => s.unbuy)
  const stapleBought = useAppStore((s) => s.stapleBought)
  const toggleStaple = useAppStore((s) => s.toggleStaple)
  const sh = useMemo(() => shopping(data, today), [data, today])
  const tripToday = sh.trip === today
  const lastDay = addDays(sh.after, -1)
  const urgent = byCategory(Object.keys(sh.urgentDef) as ProductId[])
  const trip = byCategory(Object.keys(sh.tripDef) as ProductId[])
  const recent = data.bought.filter((b) => b.date >= addDays(today, -1)).slice().reverse()
  const emptyPantry = !Object.values(data.pantry).some((v) => (v ?? 0) > 0)
  const nothing = !urgent.length && !trip.length && !sh.lowStaples.length

  return (
    <>
      <TopRow />
      <PageTitle title="Покупки" sub="Закупки по воскресеньям и средам. Список считается сам: меню минус то, что уже лежит дома." />

      {emptyPantry && !nothing && (
        <Note className="mt-4">
          <span className="font-semibold">Первый запуск: кладовка пуста, поэтому в списке всё.</span> Купи по списку и жми «Купил» у каждой позиции. Если что-то уже есть дома,
          впиши это в «Склад → Кладовка».
        </Note>
      )}

      <div className="mt-5 flex flex-col gap-6">
        {!tripToday && urgent.length > 0 && (
          <Group title={`Нужно до ${untilDay(today, sh.trip)}`} sub={`Этого не хватит уже до ближайшей закупки ${relDay(today, sh.trip)}.`}>
            {urgent.map((id) => (
              <BuyRow key={`u-${id}-${sh.urgentDef[id]}`} id={id} need={sh.urgentDef[id]!} sh={sh} today={today} />
            ))}
          </Group>
        )}

        {trip.length > 0 && (
          <Group
            title={tripToday ? 'Закупка сегодня' : `Закупка ${relDay(today, sh.trip)}, ${dateLong(sh.trip)}`}
            sub={`Хватит до ${untilDay(today, lastDay)} включительно, следующая закупка ${relDay(today, sh.after)}.`}
          >
            {trip.map((id) => (
              <BuyRow key={`t-${id}-${sh.tripDef[id]}`} id={id} need={sh.tripDef[id]!} sh={sh} today={today} />
            ))}
          </Group>
        )}

        {sh.lowStaples.length > 0 && (
          <Group title="Заканчивается" sub="Бакалея, которую ты отметил на складе.">
            {sh.lowStaples.map((id) => (
              <li key={id} className="flex min-h-14 items-center gap-3 py-1.5 pr-2 pl-4">
                <div className="min-w-0 flex-1 font-semibold">{PRODUCTS[id].name}</div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    stapleBought(id)
                    toast(`Куплено: ${PRODUCTS[id].name}`, { action: { label: 'Отменить', onClick: () => toggleStaple(id) } })
                  }}
                >
                  Купил
                </Button>
              </li>
            ))}
          </Group>
        )}

        {nothing && (
          <EmptyState icon={<ShoppingBag />} title={`Всё есть до ${untilDay(today, lastDay)} включительно`}>
            Можно в магазин не ходить. Список обновится сам, когда что-то начнёт заканчиваться.
          </EmptyState>
        )}

        {recent.length > 0 && (
          <section className="flex flex-col gap-2">
            <Eyebrow>Недавно добавлено в кладовку</Eyebrow>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {recent.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-1.5 pr-1.5 pl-4">
                  <div className="min-w-0 flex-1 py-1">
                    <div className="font-semibold">{PRODUCTS[b.prod].name}</div>
                    <div className="num text-[13.5px] text-muted-foreground">
                      {fmtQ(b.qty, PRODUCTS[b.prod].unit)} · {relDay(today, b.date)}
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => unbuy(b.id)} className="text-muted-foreground">
                    <Undo2 aria-hidden />
                    Отменить
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}

function Group({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <SectionTitle className="min-h-0">{title}</SectionTitle>
        <p className="mt-1 text-[14px] text-muted-foreground">{sub}</p>
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">{children}</ul>
    </section>
  )
}

function BuyRow({ id, need, sh, today }: { id: ProductId; need: number; sh: Shopping; today: ISODate }) {
  const buy = useAppStore((s) => s.buy)
  const unbuy = useAppStore((s) => s.unbuy)
  const have = useAppStore((s) => s.data.pantry[id] ?? 0)
  const p = PRODUCTS[id]
  const [qty, setQty] = useState(() => roundBuy(id, need))
  const ice = shopFreezerHint(sh, id)

  const onBuy = () => {
    if (!(qty > 0)) return
    buy(id, qty)
    const last = useAppStore.getState().data.bought.at(-1)
    toast(`В кладовке: ${p.name} +${fmtQ(qty, p.unit)}`, last && { action: { label: 'Отменить', onClick: () => unbuy(last.id) } })
  }

  return (
    <li className="flex items-center gap-2 py-2 pr-2 pl-4">
      <div className="min-w-0 flex-1 py-1">
        <div className="leading-snug font-semibold">{p.name}</div>
        <div className="num mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-muted-foreground">
          <span>не хватает {fmtQ(need, p.unit)}</span>
          {have > 0 && <span>дома {fmtQ(have, p.unit)}</span>}
          {ice && (
            <Chip tone="ice" icon={<Snowflake />}>
              {`дома сразу в морозилку · нужно ${relDay(today, ice)}`}
            </Chip>
          )}
        </div>
      </div>
      <QtyInput value={qty} unit={p.unit} label={`Сколько купил: ${p.name}`} onCommit={setQty} className="gap-1" />
      <Button variant="secondary" onClick={onBuy} className="px-3.5">
        Купил
      </Button>
    </li>
  )
}
