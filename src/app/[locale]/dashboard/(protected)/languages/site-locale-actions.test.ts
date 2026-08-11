import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  revalidatePath: vi.fn(),
  requireStudioOwner: vi.fn(),
  setStatus: vi.fn(),
  workspace: vi.fn(),
}))

vi.mock('next/cache', () => ({revalidatePath: mocks.revalidatePath}))
vi.mock('@/server/studio-auth/configured-access', () => ({
  requireStudioOwner: mocks.requireStudioOwner,
}))
vi.mock('@/server/site-locales/configured-site-locales', () => ({
  configuredSiteLocaleService: {
    create: mocks.create,
    setStatus: mocks.setStatus,
  },
}))
vi.mock('@/server/translations/configured-translations', () => ({
  configuredTranslationService: {workspace: mocks.workspace},
}))

import {INITIAL_SITE_LOCALE_ACTION_STATE} from '@/components/studio/site-locale-action-state'

import {
  createSiteLocaleAction,
  updateSiteLocaleStatusAction,
} from './site-locale-actions'

describe('site locale Dashboard actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudioOwner.mockResolvedValue({
      id: '10000000-0000-4000-8000-000000000001',
      role: 'OWNER',
    })
    mocks.create.mockResolvedValue({code: 'de'})
    mocks.setStatus.mockResolvedValue({code: 'de', status: 'ACTIVE'})
    mocks.workspace.mockResolvedValue({
      entries: [
        {key: 'navigation.home', values: {de: {missing: false}}},
      ],
      locales: [{code: 'de'}],
      sections: ['navigation'],
    })
  })

  it('creates a normalized draft locale through the owner boundary', async () => {
    const formData = new FormData()

    formData.set('code', 'de')
    formData.set('direction', 'LTR')
    formData.set('englishName', 'German')
    formData.set('nativeName', 'Deutsch')
    formData.set('sortOrder', '4')

    await expect(
      createSiteLocaleAction(INITIAL_SITE_LOCALE_ACTION_STATE, formData),
    ).resolves.toEqual({
      message: 'Deutsch was added as a draft language.',
      status: 'success',
    })
    expect(mocks.create).toHaveBeenCalledWith({
      actorUserId: '10000000-0000-4000-8000-000000000001',
      code: 'de',
      direction: 'LTR',
      englishName: 'German',
      nativeName: 'Deutsch',
      sortOrder: 4,
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('updates locale lifecycle through the owner boundary', async () => {
    const formData = new FormData()

    formData.set('code', 'de')
    formData.set('status', 'ACTIVE')

    await updateSiteLocaleStatusAction(formData)

    expect(mocks.setStatus).toHaveBeenCalledWith({
      actorUserId: '10000000-0000-4000-8000-000000000001',
      code: 'de',
      status: 'ACTIVE',
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('refuses to activate a locale while interface translations are missing', async () => {
    mocks.workspace.mockResolvedValueOnce({
      entries: [
        {key: 'navigation.home', values: {de: {missing: true}}},
      ],
      locales: [{code: 'de'}],
      sections: ['navigation'],
    })
    const formData = new FormData()

    formData.set('code', 'de')
    formData.set('status', 'ACTIVE')

    await expect(updateSiteLocaleStatusAction(formData)).rejects.toThrow(
      'SITE_LOCALE_TRANSLATIONS_INCOMPLETE',
    )
    expect(mocks.setStatus).not.toHaveBeenCalled()
  })

  it('never hides an owner authorization failure as a form error', async () => {
    mocks.requireStudioOwner.mockRejectedValue(new Error('UNAUTHORIZED'))

    await expect(
      createSiteLocaleAction(
        INITIAL_SITE_LOCALE_ACTION_STATE,
        new FormData(),
      ),
    ).rejects.toThrow('UNAUTHORIZED')
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
