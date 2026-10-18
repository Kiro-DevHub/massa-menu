import { Lightbulb, LineChart, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Card, EmptyState, Group, GroupLabel, Note, ScreenHeader } from '@/components/common'
import { Button } from '@/components/ui/button'
import { dateShort, diffDays, type ISODate } from '@/logic/dates'
import { fmtKg, parseNum } from '@/logic/format'
import type { WeightEntry } from '@/logic/types'
import { avg7, weightAdvice, weightStats } from '@/logic/weight'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useToday } from '@/store/hooks'

const fmt = (x: number | null) => (x == null ? 'нет' : fmtKg(x))

export default function WeightScreen() {
  const today = useToday()
  const weights = useAppStore((s) => s.data.weight)
  const setWeight = useAppStore((s) => s.setWeight)
  const removeWeight = useAppStore((s) => s.removeWeight)
  const todays = weights.find((w) => w.d === today)
  const [text, setText] = useState(todays ? fmtKg(todays.kg) : '')
  const [error, setError] = useState<string | null>(null)
  const st = weightStats(weights, today)
  const advice = weightAdvice(st.delta)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = parseNum(text)
    if (!(v >= 30 && v <= 200)) return setError('Введи вес в килограммах, например 72,4.')
    setWeight(v)
    setError(null)
    toast(`Записано: ${fmtKg(Math.round(v * 10) / 10)} кг`)
  }

  return (
    <div className="flex flex-col gap-7">
      <ScreenHeader title="Вес" sub="Утром натощак, 3–4 раза в неделю. Смотри на среднее: дневные скачки бывают из-за воды и соли." />

      <form onSubmit={submit} noValidate className="flex flex-col gap-2">
        <label htmlFor="kg" className="px-1 text-[13.5px] font-semibold text-muted-foreground">
          {todays ? 'Сегодня уже записано, можно поправить' : 'Вес сегодня'}
        </label>
        <div className="flex gap-2">
          <div className="flex h-14 min-w-0 flex-1 items-center rounded-[16px] bg-surface pr-4 focus-within:ring-2 focus-within:ring-saffron dark:border dark:border-line">
            <input
              id="kg"
              inputMode="decimal"
              enterKeyHint="done"
              placeholder="72,4"
              value={text}
              aria-invalid={!!error}
              aria-describedby={error ? 'kg-err' : undefined}
              onChange={(e) => {
                setText(e.target.value.replace(/[^\d.,]/g, ''))
                setError(null)
              }}
              className="num h-full min-w-0 flex-1 bg-transparent pl-4 font-display text-[24px] font-light outline-none placeholder:text-surface-3"
            />
            <span className="text-[15px] text-muted-foreground">кг</span>
          </div>
          <Button type="submit" size="lg" className="h-14 px-6">
            {todays ? 'Обновить' : 'Записать'}
          </Button>
        </div>
        {error && (
          <p id="kg-err" role="alert" className="px-1 text-[14px] font-medium text-bad">
            {error}
          </p>
        )}
      </form>

      <section className="flex flex-col gap-4">
        <div className="grid grid-cols-3 divide-x divide-line">
          <Stat v={fmt(st.cur)} k="среднее за неделю" />
          <Stat v={fmt(st.prev)} k="две недели назад" />
          <Stat
            v={st.delta == null ? 'нет' : (st.delta >= 0 ? '+' : '−') + fmtKg(Math.abs(st.delta))}
            k="изменение"
            className={st.delta == null ? undefined : advice === 'ok' ? 'text-ok' : 'text-warn'}
          />
        </div>
        <Note icon={<Lightbulb />}>
          {advice === 'none' && 'Совет появится, когда наберётся две недели взвешиваний. Нормальный темп набора: +0,25–0,5 кг в неделю.'}
          {advice === 'slow' && (
            <>
              <b className="font-semibold">Вес почти не растёт.</b> Добавь около 200 ккал в день: +50 г риса или пасты в обед и ещё один банан.
            </>
          )}
          {advice === 'fast' && (
            <>
              <b className="font-semibold">Набор быстрее 0,7 кг в неделю.</b> Часть может уходить в жир. Можно убрать сок на завтрак или половину ланча.
            </>
          )}
          {advice === 'ok' && (
            <>
              <b className="font-semibold">Темп хороший.</b> Ничего не меняй и продолжай.
            </>
          )}
        </Note>
      </section>

      {weights.length >= 2 ? (
        <Card className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[15px] font-semibold">Как меняется вес</div>
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <i className="h-[3px] w-3.5 rounded-full bg-saffron" />
                среднее
              </span>
              <span className="inline-flex items-center gap-1.5">
                <i className="size-1.5 rounded-full bg-muted-foreground/70" />
                замеры
              </span>
            </div>
          </div>
          <WeightChart ws={weights} />
        </Card>
      ) : (
        <EmptyState icon={<LineChart />} title="График появится со второй записи">
          Запиши вес сегодня и в следующий раз, когда встанешь на весы.
        </EmptyState>
      )}

      {weights.length > 0 && (
        <section className="flex flex-col gap-2">
          <GroupLabel>Записи</GroupLabel>
          <Group>
            {weights
              .slice(-10)
              .reverse()
              .map((w) => (
                <li key={w.d} className="flex items-center gap-3 py-1 pr-1.5 pl-4">
                  <div className="num min-w-0 flex-1 py-2">
                    <span className="text-[16px] font-semibold">{fmtKg(w.kg)} кг</span>
                    <span className="ml-2 text-[14px] text-muted-foreground">{w.d === today ? 'сегодня' : dateShort(w.d)}</span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Удалить запись ${dateShort(w.d)}`}
                    onClick={() => {
                      removeWeight(w.d)
                      toast(`Запись ${dateShort(w.d)} удалена`, { action: { label: 'Вернуть', onClick: () => setWeight(w.kg, w.d) } })
                    }}
                    className="grid size-11 place-items-center rounded-[12px] text-muted-foreground active:bg-surface-2"
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                </li>
              ))}
          </Group>
        </section>
      )}
    </div>
  )
}

function Stat({ v, k, className }: { v: string; k: string; className?: string }) {
  return (
    <div className="px-3 first:pl-1">
      <div className={cn('font-display text-[26px] leading-none font-light tracking-[-0.03em]', className)}>{v}</div>
      <div className="mt-1.5 text-[12.5px] leading-tight text-muted-foreground">{k}</div>
    </div>
  )
}

/** Точки: отдельные взвешивания. Линия с заливкой: среднее за 7 дней. */
function WeightChart({ ws }: { ws: WeightEntry[] }) {
  const W = 340
  const H = 180
  const pl = 30
  const pr = 8
  const pt = 14
  const pb = 22
  const d0 = ws[0]!.d
  const d1 = ws[ws.length - 1]!.d
  const span = Math.max(1, diffDays(d0, d1))
  const avg = ws.map((w) => ({ d: w.d, v: avg7(ws, w.d)! }))
  const all = ws.map((w) => w.kg).concat(avg.map((a) => a.v))
  const lo = Math.floor(Math.min(...all) * 2) / 2 - 0.5
  const hi = Math.ceil(Math.max(...all) * 2) / 2 + 0.5
  const x = (d: ISODate) => pl + (diffDays(d0, d) / span) * (W - pl - pr)
  const y = (v: number) => pt + ((hi - v) / (hi - lo)) * (H - pt - pb)
  const step = hi - lo > 4 ? 1 : 0.5
  const ticks: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(v)
  const line = avg.map((a, i) => `${i ? 'L' : 'M'}${x(a.d).toFixed(1)},${y(a.v).toFixed(1)}`).join('')
  const area = `${line}L${x(d1).toFixed(1)},${H - pb}L${x(d0).toFixed(1)},${H - pb}Z`
  const last = avg[avg.length - 1]!
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 block h-auto w-full" role="img" aria-label={`Среднее за неделю сейчас ${fmtKg(last.v)} кг`}>
      <defs>
        <linearGradient id="wfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--saffron)" stopOpacity="0.3" />
          <stop offset="1" stopColor="var(--saffron)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 4" />
          <text x={pl - 6} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill="var(--muted)" className="num">
            {fmtKg(v)}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#wfill)" />
      <path d={line} fill="none" stroke="var(--saffron)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {ws.map((w) => (
        <circle key={w.d} cx={x(w.d)} cy={y(w.kg)} r="2.75" fill="var(--muted)" opacity="0.55" />
      ))}
      <circle cx={x(last.d)} cy={y(last.v)} r="5.5" fill="var(--saffron)" stroke="var(--surface)" strokeWidth="2.5" />
      <text x={pl} y={H - 5} fontSize="10" fill="var(--muted)">
        {dateShort(d0)}
      </text>
      <text x={W - pr} y={H - 5} fontSize="10" textAnchor="end" fill="var(--muted)">
        {dateShort(d1)}
      </text>
    </svg>
  )
}
