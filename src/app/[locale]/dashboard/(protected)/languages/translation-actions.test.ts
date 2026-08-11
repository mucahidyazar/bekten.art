import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  listLocales: vi.fn(),
  revalidatePath: vi.fn(),
  requireStudioEditor: vi.fn(),
  saveRow: vi.fn(),
}))

vi.mock('next/cache', () => ({revalidatePath: mocks.revalidatePath}))
vi.mock('@/server/studio-auth/configured-access', () => ({
  requireStudioEditor: mocks.requireStudioEditor,
}))
vi.mock('@/server/translations/configured-translations', () => ({
  configuredTranslationService: {saveRow: mocks.saveRow},
}))
vi.mock('@/server/site-locales/configured-site-locales', () => ({
  configuredSiteLocaleService: {list: mocks.listLocales},
}))

import {INITIAL_TRANSLATION_ACTION_STATE} from '@/components/studio/translation-action-state'

import {saveTranslationRowAction} from './translation-actions'

function translationFormData() {
  const formData = new FormData()

  formData.set('key', 'navigation.works')
  formData.set('en', 'Works')
  formData.set('tr', 'Eserler')
  formData.set('ru', 'Работы')
  formData.set('ky', 'Эмгектер')
  formData.set('de', 'Werke')

  return formData
}

describe('translation dashboard action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudioEditor.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000001',
      role: 'EDITOR',
    })
    mocks.saveRow.mockResolvedValue(undefined)
    mocks.listLocales.mockResolvedValue([
      {code: 'en'},
      {code: 'tr'},
      {code: 'ru'},
      {code: 'ky'},
      {code: 'de'},
    ])
  })

  it('authorizes, persists every registered language, and invalidates public messages', async () => {
    await expect(
      saveTranslationRowAction(
        INITIAL_TRANSLATION_ACTION_STATE,
        translationFormData(),
      ),
    ).resolves.toEqual({
      message: 'navigation.works was saved in 5 languages.',
      status: 'success',
    })
    expect(mocks.requireStudioEditor).toHaveBeenCalledOnce()
    expect(mocks.saveRow).toHaveBeenCalledWith({
      actorUserId: '00000000-0000-4000-8000-000000000001',
      key: 'navigation.works',
      values: {
        en: 'Works',
        de: 'Werke',
        ky: 'Эмгектер',
        ru: 'Работы',
        tr: 'Eserler',
      },
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('returns a safe error without calling persistence for malformed input', async () => {
    const formData = translationFormData()

    formData.delete('de')

    await expect(
      saveTranslationRowAction(INITIAL_TRANSLATION_ACTION_STATE, formData),
    ).resolves.toEqual({
      message: 'Review the translations and try again.',
      status: 'error',
    })
    expect(mocks.saveRow).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it('does not convert an authorization failure into a form error', async () => {
    mocks.requireStudioEditor.mockRejectedValue(new Error('UNAUTHORIZED'))

    await expect(
      saveTranslationRowAction(
        INITIAL_TRANSLATION_ACTION_STATE,
        translationFormData(),
      ),
    ).rejects.toThrow('UNAUTHORIZED')
    expect(mocks.saveRow).not.toHaveBeenCalled()
  })
})
