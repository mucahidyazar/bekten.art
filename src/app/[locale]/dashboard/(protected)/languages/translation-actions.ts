'use server'

import {revalidatePath} from 'next/cache'

import {z} from 'zod'

import {configuredSiteLocaleService} from '@/server/site-locales/configured-site-locales'
import {requireStudioEditor} from '@/server/studio-auth/configured-access'
import {configuredTranslationService} from '@/server/translations/configured-translations'

import type {TranslationActionState} from '@/components/studio/translation-action-state'
const translationFormSchema = z
  .object({
    key: z.string().min(1).max(300),
    values: z.record(z.string(), z.string().min(1).max(5_000)),
  })
  .strict()

async function saveTranslationRowAction(
  _previousState: TranslationActionState,
  formData: FormData,
): Promise<TranslationActionState> {
  const user = await requireStudioEditor()

  try {
    const locales = await configuredSiteLocaleService.list()
    const parsed = translationFormSchema.parse({
      key: formData.get('key'),
      values: Object.fromEntries(
        locales.map(locale => [locale.code, formData.get(locale.code)]),
      ),
    })

    await configuredTranslationService.saveRow({
      actorUserId: user.id,
      key: parsed.key,
      values: parsed.values,
    })
    revalidatePath('/', 'layout')

    return Object.freeze({
      message: `${parsed.key} was saved in ${locales.length} languages.`,
      status: 'success',
    })
  } catch {
    return Object.freeze({
      message: 'Review the translations and try again.',
      status: 'error',
    })
  }
}

export {saveTranslationRowAction}
