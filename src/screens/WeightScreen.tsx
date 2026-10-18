import { Scale, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { TopRow } from '@/components/AppShell'
import { Card, EmptyState, Eyebrow, Note, PageTitle } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    <>
      <TopRow />
      <PageTitle title="Вес" sub="Взвешивайся утром натощак 3–4 раза в неделю. Смотри на среднее за неделю: скачки на 0,5–1 кг за день бывают из-за воды и соли." />

      <form onSubmit={submit} className="mt-5 flex flex-col gap-2" noValidate>
        <label htmlFor="kg" className="text-[13.5px] font-medium text-muted-foreground">
          {todays ? 'Вес сегодня записан, можно поправить' : 'Вес сегодня, кг'}
        </label>
        <div className="flex gap-2">
          <Input
            id="kg"
            inputMode="decimal"
            enterKeyHint="done"
            placeholder="72,4"
            value={text}
            aria-invalid={!!error}
            onChange={(e) => {
              setText(e.target.value.replace(/[^\d.,]/g, ''))
              setError(null)
            }}
            className="num h-12 flex-1 font-display text-[20px] font-semibold"
          />
          <Button type="submit" className="h-12 px-5">
            {todays ? 'Обновить' : 'Сохранить'}
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-[14px] font-medium text-bad">
            {error}
          </p>
        )}
      </form>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Stat v={fmt(st.cur)} k="среднее за 7 дней" />
        <Stat v={fmt(st.prev)} k="2 недели назад" />
        <Stat v={st.delta == null ? 'нет' : (st.delta >= 0 ? '+' : '−') + fmtKg(Math.abs(st.delta))} k="изменение" accent />
      </div>

      <Note className="mt-3">
        {advice === 'none' && 'Совет появится, когда наберётся две недели взвешиваний. Нормальный темп набора: +0,25–0,5 кг в неделю, то есть +0,5–1 кг за две.'}
        {advice === 'slow' && (
          <>
            <b>Вес почти не растёт.</b> Добавь около 200 ккал в день: +50 г риса или пасты в обед и ещё один банан. Через две недели проверь снова.
          </>
        )}
        {advice === 'fast' && (
          <>
            <b>Набор быстрее 0,7 кг в неделю.</b> Часть может уходить в жир. Можно убрать сок на завтрак или половину ланча.
          </>
        )}
        {advice === 'ok' && (
          <>
            <b>Темп хороший.</b> Ничего не меняй и продолжай.
          </>
        )}
      </Note>

      <section className="mt-5">
        {weights.length >= 2 ? (
          <Card className="p-4">
            <Eyebrow>Среднее за 7 дней и отдельные взвешивания</Eyebrow>
            <WeightChart ws={weights} />
          </Card>
        ) : (
          <EmptyState icon={<Scale />} title="График появится со второй записи">
            Запиши вес сегодня и в следующий раз, когда встанешь на весы.
          </EmptyState>
        )}
      </section>

      {weights.length > 0 && (
        <section className="mt-5 flex flex-col gap-2">
          <Eyebrow>Записи</Eyebrow>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {weights
              .slice(-10)
              .reverse()
              .map((w) => (
                <li key={w.d} className="flex items-center gap-3 py-1.5 pr-1.5 pl-4">
                  <div className="num min-w-0 flex-1 py-1">
                    <span className="font-display text-[17px] font-semibold">{fmtKg(w.kg)} кг</span>
                    <span className="ml-2 text-[14px] text-muted-foreground">{w.d === today ? 'сегодня' : dateShort(w.d)}</span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Удалить запись ${dateShort(w.d)}`}
                    onClick={() => {
                      removeWeight(w.d)
                      toast(`Запись ${dateShort(w.d)} удалена`, { action: { label: 'Вернуть', onClick: () => setWeight(w.kg, w.d) } })
                    }}
                    className="grid size-11 place-items-center rounded-xl text-muted-foreground active:bg-surface-2"
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}
    </>
  )
}

function Stat({ v, k, accent }: { v: string; k: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-3">
      <div className={cn('font-display text-[21px] leading-none font-semibold', accent && 'text-saffron-ink')}>{v}</div>
      <div className="mt-1.5 text-[12.5px] leading-tight text-muted-foreground">{k}</div>
    </div>
  )
}

/** Точки — отдельные взвешивания, линия с заливкой — среднее за 7 дней. */
function WeightChart({ ws }: { ws: WeightEntry[] }) {
  const W = 340
  const H = 180
  const pl = 34
  const pr = 10
  const pt = 12
  const pb = 24
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
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 block h-auto w-full" role="img" aria-label={`График веса: среднее сейчас ${fmtKg(last.v)} кг`}>
      <defs>
        <linearGradient id="wfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--saffron)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--saffron)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth="1" />
          <text x={pl - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted)" className="num">
            {fmtKg(v)}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#wfill)" />
      <path d={line} fill="none" stroke="var(--saffron)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {ws.map((w) => (
        <circle key={w.d} cx={x(w.d)} cy={y(w.kg)} r="3" fill="var(--muted)" opacity="0.6" />
      ))}
      <circle cx={x(last.d)} cy={y(last.v)} r="5" fill="var(--saffron)" stroke="var(--surface)" strokeWidth="2" />
      <text x={pl} y={H - 6} fontSize="10" fill="var(--muted)">
        {dateShort(d0)}
      </text>
      <text x={W - pr} y={H - 6} fontSize="10" textAnchor="end" fill="var(--muted)">
        {dateShort(d1)}
      </text>
    </svg>
  )
}
