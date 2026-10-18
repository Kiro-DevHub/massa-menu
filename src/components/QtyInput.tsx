import { useState } from 'react'
import type { Unit } from '@/data'
import { parseNum } from '@/logic/format'
import { cn } from '@/lib/utils'

const show = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',')

/** Поле количества с единицей. Значение применяется при уходе из поля или по Enter. */
export function QtyInput({
  value,
  unit,
  label,
  onCommit,
  className,
}: {
  value: number
  unit?: Unit
  label: string
  onCommit: (v: number) => void
  className?: string
}) {
  const [text, setText] = useState(show(value))
  const [focused, setFocused] = useState(false)
  const [prev, setPrev] = useState(value)
  // Значение поменялось снаружи (например, после «Съел») — показываем новое, если поле не в фокусе.
  if (!focused && value !== prev) {
    setPrev(value)
    setText(show(value))
  }

  const commit = () => {
    setFocused(false)
    const v = parseNum(text)
    const next = Number.isFinite(v) && v > 0 ? v : 0
    if (Math.abs(next - value) > 1e-9) onCommit(next)
    else setText(show(value))
  }

  return (
    <label className={cn('flex flex-none items-center gap-1.5', className)}>
      <input
        type="text"
        inputMode="decimal"
        enterKeyHint="done"
        aria-label={label}
        value={text}
        onFocus={(e) => {
          setFocused(true)
          e.currentTarget.select()
        }}
        onChange={(e) => setText(e.target.value.replace(/[^\d.,]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="num h-11 w-[78px] rounded-xl border border-line bg-bg px-2.5 text-right text-[16px] font-semibold outline-none focus:border-saffron focus:ring-3 focus:ring-saffron/25"
      />
      <span className="w-6 text-[13.5px] text-muted-foreground">{unit}</span>
    </label>
  )
}
