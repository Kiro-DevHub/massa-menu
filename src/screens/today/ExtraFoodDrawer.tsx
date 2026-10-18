import { Plus } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { PRESETS, type Preset } from '@/data'
import { MacroLine } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { DW_FULL, dateLong, weekday, type ISODate } from '@/logic/dates'
import { parseNum } from '@/logic/format'
import { useAppStore } from '@/store/app-store'

/** Еда вне меню: пресеты и свой вариант. */
export function ExtraFoodDrawer({ date, open, onOpenChange }: { date: ISODate; open: boolean; onOpenChange: (v: boolean) => void }) {
  const addExtra = useAppStore((s) => s.addExtra)
  const [form, setForm] = useState({ name: '', k: '', p: '', f: '', c: '' })
  const [error, setError] = useState<string | null>(null)
  const id = useId()
  const dirty = Object.values(form).some(Boolean)

  const add = (x: Preset) => {
    addExtra(date, x)
    onOpenChange(false)
    toast(`Добавлено: ${x.name}`, { description: `${x.k} ккал в ${DW_FULL[weekday(date)].toLowerCase()}` })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    const k = parseNum(form.k)
    if (!name) return setError('Напиши, что съел.')
    if (!(k > 0)) return setError('Укажи калории: хотя бы примерно.')
    const n = (s: string) => Math.max(0, parseNum(s) || 0)
    add({ name, k, p: n(form.p), f: n(form.f), c: n(form.c) })
    setForm({ name: '', k: '', p: '', f: '', c: '' })
    setError(null)
  }

  const field = (key: keyof typeof form, label: string, extra: React.ComponentProps<'input'> = {}) => (
    <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-muted-foreground">
      {label}
      <Input
        value={form[key]}
        onChange={(e) => {
          setForm({ ...form, [key]: e.target.value })
          setError(null)
        }}
        className="num"
        {...extra}
      />
    </label>
  )

  return (
    // Пока форма заполнена, свайп вниз её не закрывает: данные не теряются.
    <Drawer open={open} onOpenChange={onOpenChange} dismissible={!dirty}>
      <DrawerContent aria-describedby={`${id}-d`}>
        <DrawerHeader>
          <DrawerTitle>Вне меню</DrawerTitle>
          <DrawerDescription id={`${id}-d`}>
            {DW_FULL[weekday(date)]}, {dateLong(date)}. Значения средние, для учёта этого хватает.
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-5 pb-5">
          <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-[20px] bg-surface-2/60">
            {PRESETS.map((p) => (
              <li key={p.name}>
                <button type="button" onClick={() => add(p)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-surface-2">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{p.name}</span>
                    <MacroLine m={p} />
                  </span>
                  <Plus className="size-5 text-saffron-ink" aria-label="Добавить" />
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-3" noValidate>
            <h3 className="text-[17px] font-semibold">Свой вариант</h3>
            {field('name', 'Что съел', { placeholder: 'Например, плов у бабушки', maxLength: 60, autoComplete: 'off', enterKeyHint: 'next' })}
            <div className="grid grid-cols-4 gap-2">
              {field('k', 'Ккал', { inputMode: 'numeric' })}
              {field('p', 'Белки', { inputMode: 'decimal', placeholder: '0' })}
              {field('f', 'Жиры', { inputMode: 'decimal', placeholder: '0' })}
              {field('c', 'Углев.', { inputMode: 'decimal', placeholder: '0' })}
            </div>
            {error && (
              <p role="alert" className="text-[14px] font-medium text-bad">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="mt-1">
              Добавить
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
