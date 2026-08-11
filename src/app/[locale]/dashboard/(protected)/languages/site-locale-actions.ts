'use server'

import {revalidatePath} from 'next/cache'

import {z} from 'zod'

import {configuredSiteLocaleService} from '@/server/site-locales/configured-site-locales'
import {requireStudioOwner} from '@/server/studio-auth/configured-access'
import {configuredTranslationService} from '@/server/translations/configured-translations'

import type {SiteLocaleActionState} from '@/components/studio/site-locale-action-state'

const createLocaleFormSchema = z
  .object({
    code: z.string().trim().min(2).max(15),
    direction: z.enum(['LTR', 'RTL']),
    englishName: z.string().trim().min(2).max(80),
    nativeName: z.string().trim().min(1).max(80),
    sortOrder: z.coerce.number().int().min(0).max(1_000),
  })
  .strict()
const statusFormSchema = z
  .object({
    code: z.string().trim().min(2).max(15),
    status: z.enum(['DRAFT', 'ACTIVE', 'DISABLED']),
  })
  .strict()

async function createSiteLocaleAction(
  _previousState: SiteLocaleActionState,
  formData: FormData,
): Promise<SiteLocaleActionState> {
  const owner = await requireStudioOwner()

  try {
    const parsed = createLocaleFormSchema.parse({
      code: formData.get('code'),
      direction: formData.get('direction'),
      englishName: formData.get('englishName'),
      nativeName: formData.get('nativeName'),
      sortOrder: formData.get('sortOrder'),
    })

    await configuredSiteLocaleService.create({
      ...parsed,
      actorUserId: owner.id,
    })
    revalidatePath('/', 'layout')

    return Object.freeze({
      message: `${parsed.nativeName} was added as a draft language.`,
      status: 'success',
    })
  } catch {
    return Object.freeze({
      message: 'Review the language details and try again.',
      status: 'error',
    })
  }
}

async function updateSiteLocaleStatusAction(formData: FormData) {
  const owner = await requireStudioOwner()
  const parsed = statusFormSchema.parse({
    code: formData.get('code'),
    status: formData.get('status'),
  })

  if (parsed.status === 'ACTIVE') {
    const workspace = await configuredTranslationService.workspace()
    const hasMissingTranslation = workspace.entries.some(
      entry => entry.values[parsed.code]?.missing !== false,
    )

    if (hasMissingTranslation) {
      throw new Error('SITE_LOCALE_TRANSLATIONS_INCOMPLETE')
    }
  }

  await configuredSiteLocaleService.setStatus({
    ...parsed,
    actorUserId: owner.id,
  })
  revalidatePath('/', 'layout')
}

export {createSiteLocaleAction, updateSiteLocaleStatusAction}
