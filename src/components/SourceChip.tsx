import { Check, ChefHat, Clock3, Dumbbell, Flame, Refrigerator, Snowflake, TriangleAlert, Utensils } from 'lucide-react'
import { DW, weekday, type ISODate } from '@/logic/dates'
import type { MealSource } from '@/logic/sources'
import { Chip } from './common'

/** Человеческая подпись «откуда блюдо». */
export function SourceChip({ src, today }: { src: MealSource; today: ISODate }) {
  switch (src.kind) {
    case 'eaten':
      return (
        <Chip tone="ok" icon={<Check />}>
          {src.fromFridge ? 'съедено · из холодильника' : 'съедено'}
        </Chip>
      )
    case 'skipped':
      return <Chip>не ел</Chip>
    case 'past':
      return null
    case 'noCook':
      return <Chip icon={<Utensils />}>без готовки</Chip>
    case 'afterGym':
      return (
        <Chip tone="saffron" icon={<Dumbbell />}>
          после зала
        </Chip>
      )
    case 'quick':
      return <Chip icon={<Clock3 />}>2 минуты</Chip>
    case 'fromSession':
      return (
        <Chip tone="saffron" icon={<ChefHat />}>
          {src.date === today ? 'из заготовки сегодня' : `из заготовки ${DW[weekday(src.date)]}`}
        </Chip>
      )
    case 'freezer':
      return (
        <Chip tone="ice" icon={<Snowflake />}>
          в морозилке
        </Chip>
      )
    case 'fridge':
      return (
        <Chip tone="ok" icon={<Refrigerator />}>
          в холодильнике
        </Chip>
      )
    case 'missing':
      return (
        <Chip tone="warn" icon={<TriangleAlert />}>
          нет в холодильнике · готовь свежим
        </Chip>
      )
    case 'fresh':
      return <Chip icon={<Flame />}>{`свежее · ${src.minutes} мин`}</Chip>
  }
}
