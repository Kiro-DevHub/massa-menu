import { Check, Info, ShoppingBasket, Snowflake } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PRODUCTS, type ProductId } from '@/data'
import { EmptyState, Group, GroupLabel, Note, ScreenHeader, SectionTitle } from '@/components/common'
import { QtyInput } from '@/components/QtyInput'
import { addDays, dateLong, relDay, untilDay } from '@/logic/dates'
import { fmtQ } from '@/logic/format'
import { roundBuy, shopFreezerHint, shopping, type Shopping } from '@/logic/shopping'
import { useAppStore } from '@/store/app-store'
import { useToday } from '@/store/hooks'

const byCategory = (ids: ProductId[]) => ids.sort((a, b) => PRODUCTS[a].cat - PRODUCTS[b].cat)

/** Круглая отметка в начале строки, как в списке покупок. */
function BuyCheck({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="group grid size-11 flex-none place-items-center rounded-full active:bg-surface-2"
    >
      <span className="grid size-[26px] place-items-center rounded-full border-2 border-muted-foreground/45 text-transparent transition-colors duration-[175ms] group-hover:border-saffron group-active:border-saffron group-active:bg-saffron group-active:text-on-saffron">
        <Check className="size-4" strokeWidth={3} aria-hidden />
      </span>
    </button>
  )
}

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
    <div className="flex flex-col gap-7">
      <ScreenHeader title="Покупки" sub="Меню минус то, что уже дома. Закупки по воскресеньям и средам." />

      {emptyPantry && !nothing && (
        <Note icon={<Info />}>
          <b className="font-semibold">Кладовка пуста, поэтому в списке всё.</b> Отмечай кружком купленное. Что уже есть дома, впиши в «Склад», раздел «Кладовка».
        </Note>
      )}

      {!tripToday && urgent.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle sub={`Этого не хватит уже до закупки ${relDay(today, sh.trip)}.`}>Нужно до {untilDay(today, sh.trip)}</SectionTitle>
          <Group>
            {urgent.map((id) => (
              <BuyRow key={`u-${id}-${sh.urgentDef[id]}`} id={id} need={sh.urgentDef[id]!} sh={sh} />
            ))}
          </Group>
        </section>
      )}

      {trip.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle sub={`Хватит до ${untilDay(today, lastDay)} включительно, следующая закупка ${relDay(today, sh.after)}.`}>
            {tripToday ? 'Закупка сегодня' : `Закупка ${relDay(today, sh.trip)}, ${dateLong(sh.trip)}`}
          </SectionTitle>
          <Group>
            {trip.map((id) => (
              <BuyRow key={`t-${id}-${sh.tripDef[id]}`} id={id} need={sh.tripDef[id]!} sh={sh} />
            ))}
          </Group>
        </section>
      )}

      {sh.lowStaples.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle sub="Бакалея, которую ты отметил на складе.">Заканчивается</SectionTitle>
          <Group>
            {sh.lowStaples.map((id) => (
              <li key={id} className="flex min-h-[52px] items-center gap-1 py-1 pr-4 pl-1.5">
                <BuyCheck
                  label={`Купил: ${PRODUCTS[id].name}`}
                  onClick={() => {
                    stapleBought(id)
                    toast(`Куплено: ${PRODUCTS[id].name}`, { action: { label: 'Отменить', onClick: () => toggleStaple(id) } })
                  }}
                />
                <div className="min-w-0 flex-1 text-[16px] font-medium">{PRODUCTS[id].name}</div>
              </li>
            ))}
          </Group>
        </section>
      )}

      {nothing && (
        <EmptyState icon={<ShoppingBasket />} title={`Всё есть до ${untilDay(today, lastDay)} включительно`}>
          В магазин можно не ходить. Список обновится сам, когда что-то начнёт заканчиваться.
        </EmptyState>
      )}

      {recent.length > 0 && (
        <section className="flex flex-col gap-2">
          <GroupLabel>Недавно добавлено в кладовку</GroupLabel>
          <Group>
            {recent.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-1.5 pr-1.5 pl-4">
                <div className="min-w-0 flex-1 py-1">
                  <div className="text-[15px] font-medium">{PRODUCTS[b.prod].name}</div>
                  <div className="num text-[13px] text-muted-foreground">
                    +{fmtQ(b.qty, PRODUCTS[b.prod].unit)}, {relDay(today, b.date)}
                  </div>
                </div>
                <button type="button" onClick={() => unbuy(b.id)} className="h-11 rounded-[12px] px-3 text-[14px] font-medium text-ink-2 active:bg-surface-2">
                  Отменить
                </button>
              </li>
            ))}
          </Group>
        </section>
      )}
    </div>
  )
}

function BuyRow({ id, need, sh }: { id: ProductId; need: number; sh: Shopping }) {
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
    <li className="flex items-center gap-1 py-2 pr-2.5 pl-1.5">
      <BuyCheck label={`Купил: ${p.name}, ${fmtQ(qty, p.unit)}`} onClick={onBuy} />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="text-[16px] leading-snug font-medium">{p.name}</div>
        <div className="num mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[13px] text-muted-foreground">
          <span>нужно {fmtQ(need, p.unit)}</span>
          {have > 0 && <span>дома {fmtQ(have, p.unit)}</span>}
          {ice && (
            <span className="inline-flex items-center gap-1 font-medium text-ice">
              <Snowflake className="size-3.5" aria-hidden />
              сразу в морозилку
            </span>
          )}
        </div>
      </div>
      <QtyInput value={qty} unit={p.unit} label={`Сколько купить: ${p.name}`} onCommit={setQty} className="ml-2" />
    </li>
  )
}
