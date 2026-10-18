import { Check, ChefHat, Clock3, Dumbbell, Flame, Refrigerator, Snowflake, TriangleAlert, Utensils } from 'lucide-react'
import type { ReactNode } from 'react'
import { DW, weekday, type ISODate } from '@/logic/dates'
import type { MealSource } from '@/logic/sources'
import { cn } from '@/lib/utils'
import { Chip, type Tone } from './common'

interface SourceInfo {
  icon: ReactNode
  text: string
  tone: Tone
}

/** Человеческая подпись «откуда блюдо». */
function sourceInfo(src: MealSource, today: ISODate): SourceInfo | null {
  switch (src.kind) {
    case 'eaten':
      return { icon: <Check />, text: src.fromFridge ? 'съедено из холодильника' : 'съедено', tone: 'ok' }
    case 'skipped':
      return { icon: null, text: 'не ел', tone: 'neutral' }
    case 'past':
      return null
    case 'noCook':
      return { icon: <Utensils />, text: 'без готовки', tone: 'neutral' }
    case 'afterGym':
      return { icon: <Dumbbell />, text: 'после зала', tone: 'saffron' }
    case 'quick':
      return { icon: <Clock3 />, text: '2 минуты', tone: 'neutral' }
    case 'fromSession':
      return { icon: <ChefHat />, text: src.date === today ? 'из заготовки сегодня' : `из заготовки ${DW[weekday(src.date)]}`, tone: 'saffron' }
    case 'freezer':
      return { icon: <Snowflake />, text: 'в морозилке', tone: 'ice' }
    case 'fridge':
      return { icon: <Refrigerator />, text: 'в холодильнике', tone: 'ok' }
    case 'missing':
      return { icon: <TriangleAlert />, text: 'нет в холодильнике, готовь свежим', tone: 'warn' }
    case 'fresh':
      return { icon: <Flame />, text: `свежее, ${src.minutes} мин`, tone: 'neutral' }
  }
}

const TEXT_TONE: Record<Tone, string> = {
  neutral: 'text-muted-foreground',
  saffron: 'text-saffron-ink',
  ok: 'text-ok',
  warn: 'text-warn',
  bad: 'text-bad',
  ice: 'text-ice',
}

/** Источник одной строкой: иконка и текст в цвет статуса, без плашки. */
export function SourceLine({ src, today, className }: { src: MealSource; today: ISODate; className?: string }) {
  const s = sourceInfo(src, today)
  if (!s) return null
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13.5px] font-medium [&_svg]:size-3.5 [&_svg]:shrink-0', TEXT_TONE[s.tone], className)}>
      {s.icon}
      {s.text}
    </span>
  )
}

/** Источник плашкой (для экрана рецепта). */
export function SourceChip({ src, today }: { src: MealSource; today: ISODate }) {
  const s = sourceInfo(src, today)
  if (!s) return null
  return (
    <Chip tone={s.tone} icon={s.icon}>
      {s.text}
    </Chip>
  )
}
