'use client'

import {useActionState, useId, useState} from 'react'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'
import {cn} from '@/utils'

import {INITIAL_TRANSLATION_ACTION_STATE} from './translation-action-state'

import type {TranslationActionState} from './translation-action-state'

type TranslationValue = Readonly<{
  customized: boolean
  defaultValue: string
  missing: boolean
  value: string
}>
type TranslationEditorEntry = Readonly<{
  key: string
  values: Readonly<Record<string, TranslationValue>>
}>
type TranslationEditorLocale = Readonly<{
  code: string
  nativeName: string
}>
type StudioTranslationEditorProps = Readonly<{
  action: (
    state: TranslationActionState,
    formData: FormData,
  ) => Promise<TranslationActionState>
  entry: TranslationEditorEntry
  locales: readonly TranslationEditorLocale[]
}>

function initialValues(
  entry: TranslationEditorEntry,
  locales: readonly TranslationEditorLocale[],
) {
  return Object.freeze(
    Object.fromEntries(
      locales.map(locale => [locale.code, entry.values[locale.code]?.value ?? '']),
    ),
  )
}

function statusLabel(value: TranslationValue) {
  if (value.customized) return 'Customized'
  if (value.missing) return 'Missing · English fallback'

  return 'File default'
}

function StudioTranslationEditor({
  action,
  entry,
  locales,
}: StudioTranslationEditorProps) {
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_TRANSLATION_ACTION_STATE,
  )
  const editorId = useId()
  const [values, setValues] = useState(() => initialValues(entry, locales))

  return (
    <form action={formAction} className="space-y-3 pb-4">
      <input name="key" type="hidden" value={entry.key} />

      <div className="divide-y divide-stone-400/30 overflow-hidden rounded-md border border-stone-500/30 bg-[#fffaf0]">
        {locales.map(locale => {
          const metadata = entry.values[locale.code]

          if (!metadata) return null

          const fieldId = `${editorId}-${locale.code}`
          const helpId = `${fieldId}-help`

          return (
            <div
              className="group grid gap-2 p-3 md:grid-cols-[9rem_minmax(0,1fr)] md:items-start md:gap-4"
              key={locale.code}
            >
              <div className="flex min-w-0 items-center justify-between gap-2 pt-1 md:block">
                <label
                  className="block truncate text-sm font-semibold text-stone-900"
                  htmlFor={fieldId}
                >
                  {locale.nativeName}
                </label>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge
                    className="border-[#9a7b42]/40 bg-[#e7dcc6] px-1.5 text-[0.62rem] text-stone-800"
                    variant="outline"
                  >
                    {locale.code.toUpperCase()}
                  </Badge>
                  <span
                    className={cn(
                      'text-[0.68rem] text-stone-500',
                      metadata.customized && 'text-[#6f2a1a]',
                      metadata.missing && 'text-amber-800',
                    )}
                  >
                    {statusLabel(metadata)}
                  </span>
                </div>
              </div>

              <div className="min-w-0">
                <Textarea
                  aria-describedby={helpId}
                  className="min-h-20 resize-y border-stone-500/35 bg-[#f7f1e6] py-2 text-sm leading-6 focus-visible:border-[#6f2a1a] focus-visible:ring-[#6f2a1a]/25"
                  id={fieldId}
                  maxLength={5_000}
                  name={locale.code}
                  onChange={event =>
                    setValues(current =>
                      Object.freeze({
                        ...current,
                        [locale.code]: event.target.value,
                      }),
                    )
                  }
                  required
                  rows={2}
                  value={values[locale.code] ?? ''}
                />
                <div
                  className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[0.7rem] text-stone-500"
                  id={helpId}
                >
                  <span>
                    {(values[locale.code] ?? '').length.toLocaleString()} / 5,000
                  </span>
                  <Button
                    className="h-auto px-0 py-0.5 text-xs text-[#6f2a1a]"
                    onClick={() =>
                      setValues(current =>
                        Object.freeze({
                          ...current,
                          [locale.code]: metadata.defaultValue,
                        }),
                      )
                    }
                    type="button"
                    variant="link"
                  >
                    {metadata.missing
                      ? `Use English fallback for ${locale.nativeName}`
                      : `Use ${locale.nativeName} file default`}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-stone-500/30 bg-[#f7f1e6]/95 px-3 py-2 shadow-sm backdrop-blur">
        <p
          aria-live="polite"
          className={cn(
            'text-xs text-stone-600',
            state.status === 'error' && 'text-red-800',
            state.status === 'success' && 'text-emerald-800',
          )}
          role={state.status === 'error' ? 'alert' : 'status'}
        >
          {state.message || 'English is used whenever a translation is missing.'}
        </p>
        <Button
          className="h-9 bg-[#6f2a1a] text-[#fffaf0] hover:bg-[#552014]"
          disabled={pending}
          type="submit"
        >
          {pending ? 'Saving…' : 'Save translations'}
        </Button>
      </div>
    </form>
  )
}

export {StudioTranslationEditor}

export type {
  StudioTranslationEditorProps,
  TranslationEditorEntry,
  TranslationEditorLocale,
}
