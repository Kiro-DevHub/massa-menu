import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'wouter'
import type { Macros } from '@/data'
import { cn } from '@/lib/utils'

export type Tone = 'neutral' | 'saffron' | 'ok' | 'warn' | 'bad' | 'ice'

const TONE: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2',
  saffron: 'bg-saffron/18 text-saffron-ink',
  ok: 'bg-ok/14 text-ok',
  warn: 'bg-warn/15 text-warn',
  bad: 'bg-bad/14 text-bad',
  ice: 'bg-ice/15 text-ice',
}

/** Маленькая плашка-статус. Цвет всегда дублируется текстом (и обычно иконкой). */
export function Chip({ tone = 'neutral', icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[13px] leading-5 font-medium [&_svg]:size-3.5 [&_svg]:shrink-0',
        TONE[tone],
        className,
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  )
}

/** КБЖУ одной строкой: ккал и цветные Б/Ж/У. */
export function MacroLine({ m, mult = 1, className }: { m: Macros; mult?: number; className?: string }) {
  const r = (x: number) => Math.round(x * mult)
  return (
    <span className={cn('num inline-flex flex-wrap items-baseline gap-x-2.5 text-[13.5px] text-muted-foreground', className)}>
      <span className="font-semibold text-ink-2">{r(m.k)} ккал</span>
      <span>
        <span className="text-prot">Б</span> {r(m.p)}
      </span>
      <span>
        <span className="text-fat">Ж</span> {r(m.f)}
      </span>
      <span>
        <span className="font-semibold text-carb">У</span> {r(m.c)}
      </span>
    </span>
  )
}

/** Заголовок раздела внутри экрана. */
export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-h-11 items-center justify-between gap-3', className)}>
      <h2 className="font-display text-[17px] font-semibold tracking-[-0.01em]">{children}</h2>
      {action}
    </div>
  )
}

/** Маленький заголовок-ярлык (категория, группа). */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('text-[12px] font-semibold tracking-[0.08em] text-muted-foreground uppercase', className)}>{children}</div>
}

/** Заголовок экрана верхнего уровня. */
export function PageTitle({ title, sub, aside }: { title: ReactNode; sub?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 pt-1 pb-1">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] leading-[1.08] font-semibold tracking-[-0.02em]">{title}</h1>
        {sub && <p className="mt-1.5 text-[15px] text-muted-foreground">{sub}</p>}
      </div>
      {aside}
    </header>
  )
}

/** Кнопка «назад» для вложенных экранов. */
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      href={to}
      className="-ml-2 inline-flex h-11 items-center gap-0.5 rounded-xl pr-3 pl-1 text-[16px] font-medium text-saffron-ink active:opacity-70"
    >
      <ChevronLeft className="size-6" strokeWidth={2.2} aria-hidden />
      {children}
    </Link>
  )
}

/** Пустое состояние: что случилось и что сделать. */
export function EmptyState({ icon, title, children, action, className }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-6 py-8 text-center', className)}>
      <div className="mb-1 grid size-14 place-items-center rounded-2xl bg-surface-2 text-muted-foreground [&_svg]:size-7">{icon}</div>
      <div className="font-display text-[16px] font-semibold">{title}</div>
      {children && <p className="max-w-[34ch] text-[14.5px] text-muted-foreground">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Карточка-поверхность. */
export function Card({ className, children, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]', className)} {...rest}>
      {children}
    </div>
  )
}

/** Подсказка-заметка с шафрановой подложкой. */
export function Note({ children, className, tone = 'saffron' }: { children: ReactNode; className?: string; tone?: 'saffron' | 'ice' }) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3 text-[15px] leading-snug',
        tone === 'saffron' ? 'border-saffron/35 bg-saffron/10' : 'border-ice/30 bg-ice/10',
        className,
      )}
    >
      {children}
    </div>
  )
}
