import { Download, Monitor, Moon, ShieldCheck, ShieldAlert, Sun, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { BackLink, Card, GroupLabel } from '@/components/common'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { backupFileName, backupSummary, makeBackup, parseBackup, type Theme } from '@/logic/backup'
import { dateLong, diffDays, iso, todayISO } from '@/logic/dates'
import { plural } from '@/logic/format'
import { useAppStore } from '@/store/app-store'

type Pending = Extract<ReturnType<typeof parseBackup>, { ok: true }>

/** Отдаёт файл: на iPhone через «Поделиться» (можно сохранить в Файлы), иначе обычной загрузкой. */
async function saveFile(name: string, text: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([text], name, { type: 'application/json' })
  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (coarse && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}

export default function SettingsScreen() {
  const theme = useAppStore((s) => s.settings.theme)
  const lastBackup = useAppStore((s) => s.settings.lastBackup)
  const setTheme = useAppStore((s) => s.setTheme)
  const markBackup = useAppStore((s) => s.markBackup)
  const replaceAll = useAppStore((s) => s.replaceAll)
  const resetAll = useAppStore((s) => s.resetAll)
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null))
  }, [])

  const exportNow = async () => {
    const { data, settings } = useAppStore.getState()
    const res = await saveFile(backupFileName(todayISO()), JSON.stringify(makeBackup(data, settings), null, 1))
    if (res === 'cancelled') return
    markBackup()
    toast(res === 'shared' ? 'Бэкап готов. Сохрани его в «Файлы».' : 'Бэкап сохранён в загрузки.')
  }

  const onFile = async (f: File | undefined) => {
    if (!f) return
    const r = parseBackup(await f.text())
    if (fileRef.current) fileRef.current.value = ''
    if (!r.ok) return void toast.error(r.error)
    setPending(r)
  }

  const days = lastBackup ? diffDays(iso(new Date(lastBackup)), todayISO()) : null
  const sum = pending ? backupSummary(pending.data) : null

  return (
    <div className="flex flex-col gap-7 pt-2">
      <div>
        <BackLink to="/">Назад</BackLink>
        <h1 className="mt-2 font-display text-[30px] leading-[1.1] font-medium tracking-[-0.035em]">Настройки</h1>
      </div>

      <section className="flex flex-col gap-2">
        <GroupLabel>Тема</GroupLabel>
        <Tabs value={theme} onValueChange={(v) => setTheme(v as Theme)}>
          <TabsList aria-label="Тема оформления">
            <TabsTrigger value="auto">
              <Monitor aria-hidden />
              Авто
            </TabsTrigger>
            <TabsTrigger value="light">
              <Sun aria-hidden />
              Светлая
            </TabsTrigger>
            <TabsTrigger value="dark">
              <Moon aria-hidden />
              Тёмная
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      <section className="flex flex-col gap-2">
        <GroupLabel>Бэкап</GroupLabel>
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-[15px] leading-snug">
            Всё хранится только на этом устройстве. iPhone может стереть данные приложения, если его долго не открывать. Сохраняй бэкап раз в неделю в «Файлы» или
            iCloud Drive.
          </p>
          <p className="text-[14px] text-muted-foreground">
            {days == null
              ? 'Бэкапа ещё не было.'
              : days === 0
                ? 'Последний бэкап сделан сегодня.'
                : `Последний бэкап: ${dateLong(iso(new Date(lastBackup!)))}, ${days} ${plural(days, ['день', 'дня', 'дней'])} назад.`}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={exportNow}>
              <Download aria-hidden />
              Сохранить
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload aria-hidden />
              Загрузить
            </Button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </Card>
        {persisted !== null && (
          <p className="flex items-start gap-2 px-1 text-[13.5px] leading-snug text-muted-foreground">
            {persisted ? <ShieldCheck className="mt-0.5 size-4 flex-none text-ok" aria-hidden /> : <ShieldAlert className="mt-0.5 size-4 flex-none text-warn" aria-hidden />}
            {persisted
              ? 'Браузер обещал не очищать хранилище. Бэкап всё равно не помешает.'
              : 'Браузер может очистить хранилище при нехватке места. На iPhone это надёжнее, если приложение добавлено на экран «Домой».'}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <GroupLabel>Сброс</GroupLabel>
        <p className="px-1 text-[14.5px] leading-snug text-muted-foreground">
          Стирает отметки, склад, покупки и вес. Меню и рецепты остаются. Сначала сохрани бэкап, если данные ещё нужны.
        </p>
        <Button variant="destructive" onClick={() => setResetOpen(true)}>
          Стереть все данные
        </Button>
      </section>

      <AlertDialog open={!!pending} onOpenChange={(v) => !v && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Заменить данные из бэкапа?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.source === 'prototype' ? 'Файл из старой версии меню. ' : ''}
              {sum && `В бэкапе: ${sum.days} ${plural(sum.days, ['день', 'дня', 'дней'])} отметок, ${sum.fridge} ${plural(sum.fridge, ['порция', 'порции', 'порций'])} в холодильнике, ${sum.pantry} ${plural(sum.pantry, ['продукт', 'продукта', 'продуктов'])} в кладовке, ${sum.weight} ${plural(sum.weight, ['запись', 'записи', 'записей'])} веса.`}{' '}
              Текущие данные на этом устройстве заменятся.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="secondary">Оставить как есть</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pending) return
                replaceAll(pending.data, pending.settings)
                setPending(null)
                toast('Данные загружены из бэкапа')
              }}
            >
              Заменить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Стереть все данные?</AlertDialogTitle>
            <AlertDialogDescription>Отметки, склад, покупки и вес удалятся с этого устройства. Отменить это нельзя, вернуть можно только из бэкапа.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="secondary">Не стирать</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                resetAll()
                toast('Данные стёрты')
              }}
            >
              Стереть
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
