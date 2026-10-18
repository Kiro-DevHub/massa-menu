import { ChevronLeft, Settings2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'wouter'
import type { Macros } from '@/data'
import { cn } from '@/lib/utils'

/*
  Система форм: поверхности 20px, элементы управления 14px, плашки — капсулы.
  Группы строк — как inset-списки iOS: белый блок на сером фоне, в светлой теме без обводки.
*/

export type Tone = 'neutral' | 'saffron' | 'ok' | 'warn' | 'bad' | 'ice'

const TONE: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2',
  saffron: 'bg-saffron/16 text-saffron-ink',
  ok: 'bg-ok/12 text-ok',
  warn: 'bg-warn/12 text-warn',
  bad: 'bg-bad/12 text-bad',
  ice: 'bg-ice/12 text-ice',
}

/** Плашка-статус. Цвет всегда дублируется текстом. */
export function Chip({ tone = 'neutral', icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] leading-4 font-semibold [&_svg]:size-3.5 [&_svg]:shrink-0',
        TONE[tone],
        className,
      )}
    >
      {icon}
      <span className="min-w-0">{children}</span>
    </span>
  )
}

/** КБЖУ одной строкой: ккал и Б/Ж/У с цветными буквами. */
export function MacroLine({ m, mult = 1, className }: { m: Macros; mult?: number; className?: string }) {
  const r = (x: number) => Math.round(x * mult)
  return (
    <span className={cn('num inline-flex flex-wrap items-baseline gap-x-3 text-[13.5px] text-muted-foreground', className)}>
      <span className="font-semibold text-ink-2">{r(m.k)} ккал</span>
      <span>
        <b className="font-semibold text-prot">Б</b> {r(m.p)}
      </span>
      <span>
        <b className="font-semibold text-fat">Ж</b> {r(m.f)}
      </span>
      <span>
        <b className="font-semibold text-carb">У</b> {r(m.c)}
      </span>
    </span>
  )
}

/** Заголовок раздела внутри экрана. */
export function SectionTitle({ children, action, className, sub }: { children: ReactNode; action?: ReactNode; className?: string; sub?: ReactNode }) {
  return (
    <div className={cn('flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-[19px] leading-tight font-semibold tracking-[-0.01em]">{children}</h2>
        {sub && <p className="mt-1 text-[14px] leading-snug text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

/** Подпись над группой строк. */
export function GroupLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-1 text-[13.5px] font-semibold text-muted-foreground', className)}>{children}</div>
}

/** Группа строк в стиле inset-списка iOS. */
export function Group({ children, className, ...rest }: React.ComponentProps<'ul'>) {
  return (
    <ul className={cn('divide-y divide-line overflow-hidden rounded-[20px] bg-surface dark:border dark:border-line', className)} {...rest}>
      {children}
    </ul>
  )
}

/** Шапка экрана верхнего уровня: крупный заголовок и вход в настройки. */
export function ScreenHeader({ title, sub, aside }: { title: string; sub?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="pt-3">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-[30px] leading-[1.1] font-medium tracking-[-0.035em]">{title}</h1>
        <div className="-mr-2.5 flex items-center gap-1">
          {aside}
          <Link href="/settings" aria-label="Настройки" className="grid size-11 place-items-center rounded-[14px] text-muted-foreground active:bg-surface-2">
            <Settings2 className="size-[22px]" aria-hidden />
          </Link>
        </div>
      </div>
      {sub && <p className="mt-2 max-w-[44ch] text-[15px] leading-snug text-muted-foreground">{sub}</p>}
    </header>
  )
}

/** Кнопка «назад» для вложенных экранов. */
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link href={to} className="-ml-2 inline-flex h-11 items-center gap-0.5 rounded-[14px] pr-3 pl-1 text-[16px] font-medium text-saffron-ink active:opacity-70">
      <ChevronLeft className="size-6" strokeWidth={2.2} aria-hidden />
      {children}
    </Link>
  )
}

/** Пустое состояние: что случилось и что сделать. */
export function EmptyState({ icon, title, children, action, className }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-2 rounded-[20px] bg-surface px-6 pt-8 pb-7 text-center dark:border dark:border-line', className)}>
      <div className="mb-2 grid size-14 place-items-center rounded-full bg-saffron/14 text-saffron-ink [&_svg]:size-7">{icon}</div>
      <div className="text-[17px] font-semibold">{title}</div>
      {children && <p className="max-w-[32ch] text-[14.5px] leading-snug text-muted-foreground">{children}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

/** Поверхность. */
export function Card({ className, children, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('rounded-[20px] bg-surface shadow-[var(--shadow-card)] dark:border dark:border-line', className)} {...rest}>
      {children}
    </div>
  )
}

/** Подсказка. */
export function Note({ children, className, icon, tone = 'saffron' }: { children: ReactNode; className?: string; icon?: ReactNode; tone?: 'saffron' | 'ice' | 'neutral' }) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-[16px] px-4 py-3.5 text-[15px] leading-snug [&>svg]:mt-0.5 [&>svg]:size-[18px] [&>svg]:flex-none',
        tone === 'saffron' && 'bg-saffron/12 [&>svg]:text-saffron-ink',
        tone === 'ice' && 'bg-ice/10 [&>svg]:text-ice',
        tone === 'neutral' && 'bg-surface-2 [&>svg]:text-muted-foreground',
        className,
      )}
    >
      {icon}
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Полоска малярного скотча с подписью от руки: так подписаны контейнеры в холодильнике. */
export function Tape({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <span aria-label={label} className={cn('tape inline-block -rotate-[2deg] px-3 pt-0.5 text-[21px] leading-[1.15] font-bold whitespace-nowrap', className)}>
      {children}
    </span>
  )
}
