import { Link, useLocation } from 'wouter'
import { useMemo } from 'react'
import { shopping, shoppingCount } from '@/logic/shopping'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useToday } from '@/store/hooks'
import { BagIcon, FridgeIcon, PlateIcon, PotIcon, ScaleIcon } from './icons'

const TABS = [
  { to: '/', label: 'Сегодня', Icon: PlateIcon, match: (p: string) => p === '/' || p.startsWith('/recipe') },
  { to: '/prep', label: 'Заготовки', Icon: PotIcon, match: (p: string) => p.startsWith('/prep') },
  { to: '/stock', label: 'Склад', Icon: FridgeIcon, match: (p: string) => p.startsWith('/stock') },
  { to: '/shop', label: 'Покупки', Icon: BagIcon, match: (p: string) => p.startsWith('/shop') },
  { to: '/weight', label: 'Вес', Icon: ScaleIcon, match: (p: string) => p.startsWith('/weight') },
] as const

export const TABBAR_H = 58

export function TabBar() {
  const [path] = useLocation()
  const data = useAppStore((s) => s.data)
  const today = useToday()
  const count = useMemo(() => shoppingCount(shopping(data, today)), [data, today])

  return (
    <nav
      aria-label="Разделы"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-[var(--tabbar)] pb-safe backdrop-blur-xl backdrop-saturate-150"
    >
      <div className="mx-auto grid max-w-[560px] grid-cols-5 px-1" style={{ height: TABBAR_H }}>
        {TABS.map(({ to, label, Icon, match }) => {
          const on = match(path)
          return (
            <Link
              key={to}
              href={to}
              aria-current={on ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-[3px] text-[11px] font-semibold tracking-[0.01em] transition-colors',
                on ? 'text-ink' : 'text-muted-foreground',
              )}
            >
              <Icon className={cn('size-[26px] transition-colors', on && 'text-saffron-ink')} />
              {label}
              {to === '/shop' && count > 0 && (
                <span className="num absolute top-1 left-[calc(50%+6px)] grid h-[18px] min-w-[18px] place-items-center rounded-full bg-saffron px-1 text-[11px] font-bold text-on-saffron">
                  {count}
                  <span className="sr-only"> позиций в покупках</span>
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
