import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { Dumbbell } from 'lucide-react'
import { useEffect } from 'react'
import { TRAIN_DAYS } from '@/data'
import { weekday, type ISODate } from '@/logic/dates'
import { dayEaten, dayPlan } from '@/logic/nutrition'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU')

/** Число, которое доезжает до нового значения: обратная связь на «Съел». */
function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(value)
  const text = useTransform(mv, fmt)
  useEffect(() => {
    const c = animate(mv, value, { duration: reduce ? 0 : 0.41, ease: [0.24, 1, 0.4, 1] })
    return () => c.stop()
  }, [mv, value, reduce])
  return <motion.span>{text}</motion.span>
}

/**
 * Итог дня. «Тарелка» под цифрой — одна полоса, поделённая на Б/Ж/У по их доле в калориях плана:
 * видно, что меню держится на углеводах. Заливка каждой доли — сколько уже съедено.
 */
export function DayHero({ date }: { date: ISODate }) {
  const data = useAppStore((s) => s.data)
  const plan = dayPlan(date)
  const eat = dayEaten(data, date)
  const extraK = data.log[date]?.extras.reduce((a, x) => a + x.k, 0) ?? 0
  const left = plan.k - eat.k
  const gym = TRAIN_DAYS.includes(weekday(date))

  const parts = [
    { key: 'p', label: 'Белки', have: eat.p, need: plan.p, share: plan.p * 4, fill: 'bg-prot', track: 'bg-prot/25' },
    { key: 'f', label: 'Жиры', have: eat.f, need: plan.f, share: plan.f * 9, fill: 'bg-fat', track: 'bg-fat/25' },
    { key: 'c', label: 'Углеводы', have: eat.c, need: plan.c, share: plan.c * 4, fill: 'bg-carb', track: 'bg-carb/25' },
  ]

  return (
    <section aria-label="Итог дня" className="pt-2">
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="font-display text-[46px] leading-none font-light tracking-[-0.045em]">
            <CountUp value={eat.k} />
          </span>
          <span className="num text-[15px] whitespace-nowrap text-muted-foreground">/ {fmt(plan.k)} ккал</span>
        </div>
        {gym && (
          <span className="mb-1 inline-flex flex-none items-center gap-1.5 rounded-full bg-saffron/14 px-2.5 py-1 text-[12.5px] font-semibold text-saffron-ink">
            <Dumbbell className="size-3.5" aria-hidden />
            день зала
          </span>
        )}
      </div>
      <p className="num mt-1.5 text-[14px] text-muted-foreground">
        {left > 0 ? `Осталось ${fmt(left)} ккал` : 'План дня выполнен'}
        {extraK > 0 && <span className="text-saffron-ink">, из них {fmt(extraK)} вне меню</span>}
      </p>

      <div className="mt-4 flex gap-1.5" role="img" aria-label={`Белки ${Math.round(eat.p)} из ${plan.p} г, жиры ${Math.round(eat.f)} из ${plan.f} г, углеводы ${Math.round(eat.c)} из ${plan.c} г`}>
        {parts.map((p) => (
          <div key={p.key} className="min-w-0" style={{ flexGrow: p.share, flexBasis: 0 }}>
            <div className={cn('h-2.5 overflow-hidden rounded-full', p.track)}>
              <motion.div
                className={cn('h-full w-full origin-left rounded-full', p.fill)}
                initial={false}
                animate={{ scaleX: Math.min(1, p.need ? p.have / p.need : 0) }}
                transition={{ duration: 0.41, ease: [0.24, 1, 0.4, 1] }}
              />
            </div>
            <div className="mt-2 truncate text-[12.5px] leading-tight text-muted-foreground">{p.label}</div>
            <div className="num mt-0.5 text-[14px] leading-tight font-semibold whitespace-nowrap">
              {Math.round(p.have)}
              <span className="font-normal text-muted-foreground">/{p.need}&nbsp;г</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
