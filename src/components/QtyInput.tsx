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
  // Значение поменялось снаружи (например, после «Съел»): показываем новое, если поле не в фокусе.
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
    <label className={cn('flex h-11 flex-none items-center rounded-[12px] bg-surface-2 pr-2.5 transition-shadow focus-within:ring-2 focus-within:ring-saffron', className)}>
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
        className="num h-full w-[58px] bg-transparent pl-2.5 text-right text-[16px] font-semibold outline-none"
      />
      <span className="ml-1 w-5 text-[13.5px] text-muted-foreground">{unit}</span>
    </label>
  )
}
