import { motion } from 'motion/react'
import { SLOTS } from '@/data'
import type { ISODate } from '@/logic/dates'
import { recipeAt } from '@/logic/menu'
import { dayEaten, dayPlan } from '@/logic/nutrition'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { Card } from '@/components/common'

const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU')

/**
 * Счётчик дня. Под цифрой — день как последовательность пяти приёмов:
 * ширина отрезка пропорциональна калориям блюда, закрашен — съедено.
 */
export function MacroCard({ date, next }: { date: ISODate; next: string | null }) {
  const data = useAppStore((s) => s.data)
  const plan = dayPlan(date)
  const eat = dayEaten(data, date)
  const L = data.log[date]
  const extraK = L?.extras.reduce((a, x) => a + x.k, 0) ?? 0

  return (
    <Card className="px-4 pt-4 pb-4">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[44px] leading-none font-semibold tracking-[-0.03em]">{fmt(eat.k)}</span>
        <span className="num text-[15px] text-muted-foreground">из {fmt(plan.k)} ккал</span>
      </div>

      <div className="mt-4 flex h-3 gap-[3px]" role="img" aria-label="Приёмы дня по калориям">
        {SLOTS.map((s) => {
          const r = recipeAt(date, s.key)
          const st = L?.slots[s.key]?.st
          return (
            <div
              key={s.key}
              title={`${s.name}: ${r.k} ккал`}
              className={cn(
                'relative overflow-hidden rounded-[4px] bg-surface-3',
                st === 'skipped' && 'bg-[repeating-linear-gradient(135deg,var(--surface-3)_0_3px,transparent_3px_6px)]',
                next === s.key && 'ring-1 ring-saffron ring-offset-0',
              )}
              style={{ flexGrow: r.k }}
            >
              <motion.div
                className="absolute inset-0 origin-left bg-saffron"
                initial={false}
                animate={{ scaleX: st === 'eaten' ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[12px] text-muted-foreground" aria-hidden>
        <span>Завтрак</span>
        {extraK > 0 ? <span className="num text-saffron-ink">+{fmt(extraK)} вне меню</span> : <span>Ужин</span>}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <MacroBar label="Белки" have={eat.p} need={plan.p} color="bg-prot" />
        <MacroBar label="Жиры" have={eat.f} need={plan.f} color="bg-fat" />
        <MacroBar label="Углеводы" have={eat.c} need={plan.c} color="bg-carb" strong />
      </div>
    </Card>
  )
}

function MacroBar({ label, have, need, color, strong }: { label: string; have: number; need: number; color: string; strong?: boolean }) {
  const pct = need ? Math.min(1, have / need) : 0
  return (
    <div className="min-w-0">
      <div className="text-[12.5px] text-muted-foreground">{label}</div>
      <div className={cn('num mt-0.5 text-[15px]', strong ? 'font-semibold' : 'font-medium')}>
        {Math.round(have)}
        <span className="text-muted-foreground">/{need} г</span>
      </div>
      <div className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-surface-3">
        <motion.div
          className={cn('h-full w-full origin-left rounded-full', color)}
          initial={false}
          animate={{ scaleX: pct }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        />
      </div>
    </div>
  )
}
