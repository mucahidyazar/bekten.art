'use client'

import {Plus} from 'lucide-react'
import {useActionState, useState} from 'react'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {cn} from '@/utils'

import {INITIAL_SITE_LOCALE_ACTION_STATE} from './site-locale-action-state'

import type {SiteLocaleActionState} from './site-locale-action-state'

type LocaleSummary = Readonly<{
  code: string
  customized: number
  missing: number
  nativeName: string
  status: 'ACTIVE' | 'DISABLED' | 'DRAFT'
  total: number
}>

type StudioLocaleManagerProps = Readonly<{
  canManage: boolean
  createAction: (
    state: SiteLocaleActionState,
    formData: FormData,
  ) => Promise<SiteLocaleActionState>
  locales: readonly LocaleSummary[]
  updateStatusAction: (formData: FormData) => Promise<void>
}>

function statusTone(status: LocaleSummary['status']) {
  if (status === 'ACTIVE') return 'border-emerald-700/30 bg-emerald-50 text-emerald-900'
  if (status === 'DRAFT') return 'border-amber-700/30 bg-amber-50 text-amber-900'

  return 'border-stone-500/35 bg-stone-100 text-stone-700'
}

function nextStatus(locale: LocaleSummary) {
  return locale.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
}

function StudioLocaleManager({
  canManage,
  createAction,
  locales,
  updateStatusAction,
}: StudioLocaleManagerProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    createAction,
    INITIAL_SITE_LOCALE_ACTION_STATE,
  )

  return (
    <section aria-labelledby="registered-languages-title" className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl" id="registered-languages-title">
            Registered languages
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Draft languages stay private until an owner activates them.
          </p>
        </div>
        {canManage ? (
          <Dialog onOpenChange={setOpen} open={open}>
            <DialogTrigger asChild>
              <Button className="bg-[#6f2a1a] text-[#fffaf0] hover:bg-[#552014]">
                <Plus aria-hidden="true" className="size-4" />
                Add language
              </Button>
            </DialogTrigger>
            <DialogContent className="border-stone-500/35 bg-[#f7f1e6] sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">
                  Add public language
                </DialogTitle>
                <DialogDescription>
                  The language starts as a private draft and uses English for
                  every missing value.
                </DialogDescription>
              </DialogHeader>
              <form action={formAction} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site-locale-code">Locale code</Label>
                  <Input
                    autoComplete="off"
                    id="site-locale-code"
                    maxLength={15}
                    name="code"
                    placeholder="de or pt-BR"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-locale-direction">Direction</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue="LTR"
                    id="site-locale-direction"
                    name="direction"
                  >
                    <option value="LTR">Left to right</option>
                    <option value="RTL">Right to left</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-locale-english-name">English name</Label>
                  <Input
                    id="site-locale-english-name"
                    maxLength={80}
                    name="englishName"
                    placeholder="German"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-locale-native-name">Native name</Label>
                  <Input
                    id="site-locale-native-name"
                    maxLength={80}
                    name="nativeName"
                    placeholder="Deutsch"
                    required
                  />
                </div>
                <input name="sortOrder" type="hidden" value={locales.length} />
                <p
                  aria-live="polite"
                  className={cn(
                    'text-sm text-stone-600 sm:col-span-2',
                    state.status === 'error' && 'text-red-800',
                    state.status === 'success' && 'text-emerald-800',
                  )}
                  role={state.status === 'error' ? 'alert' : 'status'}
                >
                  {state.message}
                </p>
                <DialogFooter className="sm:col-span-2">
                  <Button
                    onClick={() => setOpen(false)}
                    type="button"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#6f2a1a] text-[#fffaf0] hover:bg-[#552014]"
                    disabled={pending}
                    type="submit"
                  >
                    {pending ? 'Adding…' : 'Create draft'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <div className="mt-4 divide-y divide-stone-500/25 overflow-hidden rounded-md border border-stone-500/35 bg-[#f7f1e6]">
        {locales.map(locale => (
          <article
            className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            key={locale.code}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-serif text-lg">
                  {locale.nativeName}
                </h3>
                <Badge variant="outline">{locale.code}</Badge>
                <Badge className={statusTone(locale.status)} variant="outline">
                  {locale.status.toLowerCase()}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-stone-600">
                {locale.total - locale.missing}/{locale.total} translated ·{' '}
                {locale.customized} customized
              </p>
            </div>
            {canManage && locale.code !== 'en' ? (
              <form action={updateStatusAction}>
                <input name="code" type="hidden" value={locale.code} />
                <input
                  name="status"
                  type="hidden"
                  value={nextStatus(locale)}
                />
                <Button
                  className="w-full sm:w-auto"
                  disabled={locale.status !== 'ACTIVE' && locale.missing > 0}
                  size="sm"
                  title={
                    locale.status !== 'ACTIVE' && locale.missing > 0
                      ? 'Complete every interface translation before activation.'
                      : undefined
                  }
                  variant="outline"
                >
                  {locale.status === 'ACTIVE'
                    ? 'Disable'
                    : locale.missing > 0
                      ? `Translate ${locale.missing} remaining`
                      : 'Activate'}
                </Button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

export type {LocaleSummary, StudioLocaleManagerProps}

export {StudioLocaleManager}
