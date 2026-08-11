import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  archive: vi.fn(),
  create: vi.fn(),
  list: vi.fn(),
  publish: vi.fn(),
  reorder: vi.fn(),
  restore: vi.fn(),
  redirect: vi.fn((_target: string) => {
    throw new Error('NEXT_REDIRECT')
  }),
  requireStudioEditor: vi.fn(),
  update: vi.fn(),
}))

vi.mock('next/navigation', () => ({redirect: mocks.redirect}))
vi.mock('@/server/editorial-persistence/configured-content', () => ({
  editorialContentRepository: {
    artworks: {
      archive: mocks.archive,
      create: mocks.create,
      list: mocks.list,
      reorder: mocks.reorder,
      update: mocks.update,
    },
  },
}))
vi.mock('@/server/editorial-persistence/configured-publishing', () => ({
  editorialPublishingService: {publish: mocks.publish, restore: mocks.restore},
}))
vi.mock('@/server/studio-auth/configured-access', () => ({
  requireStudioEditor: mocks.requireStudioEditor,
}))

import {INITIAL_STUDIO_ACTION_STATE} from '@/components/studio/editorial-action-state'
import {EditorialVersionConflictError} from '@/server/editorial-publishing'

import {
  moveStudioEditorialEntryAction,
  restoreStudioEditorialRevisionAction,
  submitEditorialEntryAction,
} from './editorial-actions'

function validArtworkData(intent = 'save') {
  const formData = new FormData()

  formData.set('intent', intent)
  formData.set('locale', 'en')
  formData.set('slug', 'winter-light')
  formData.set('display-order', '0')
  formData.set('seo-title', 'Winter Light — Bekten Art')
  formData.set(
    'seo-description',
    'An editorial record of Winter Light and its material history in the studio archive.',
  )
  formData.set('canonical-path', '/en/works/winter-light')
  formData.set('media-placements', '[]')
  formData.set('title', 'Winter Light')
  formData.set(
    'description',
    'A layered oil painting developed through quiet observations of winter light.',
  )
  formData.set('availability', 'ON_REQUEST')

  return formData
}

describe('Studio editorial actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudioEditor.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000001',
      role: 'EDITOR',
    })
  })

  it('creates a validated artwork draft and redirects to its editor', async () => {
    mocks.create.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000002',
      locale: 'en',
      slug: 'winter-light',
      version: 1,
    })

    await expect(
      submitEditorialEntryAction(
        'ARTWORK',
        null,
        null,
        INITIAL_STUDIO_ACTION_STATE,
        validArtworkData(),
      ),
    ).rejects.toThrow('NEXT_REDIRECT')

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({title: 'Winter Light'}),
      expect.objectContaining({
        actorUserId: '00000000-0000-4000-8000-000000000001',
      }),
    )
    expect(mocks.redirect).toHaveBeenCalledWith(
      '/studio/artworks/00000000-0000-4000-8000-000000000002',
    )
  })

  it('returns a safe validation state without writing invalid content', async () => {
    const formData = validArtworkData()

    formData.set('slug', 'Not kebab case')

    await expect(
      submitEditorialEntryAction(
        'ARTWORK',
        null,
        null,
        INITIAL_STUDIO_ACTION_STATE,
        formData,
      ),
    ).resolves.toMatchObject({
      message: 'Review the highlighted editorial fields.',
      status: 'error',
    })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('requires a persisted draft before publishing', async () => {
    await expect(
      submitEditorialEntryAction(
        'ARTWORK',
        null,
        null,
        INITIAL_STUDIO_ACTION_STATE,
        validArtworkData('publish'),
      ),
    ).resolves.toMatchObject({
      message: 'Save the draft before publishing it.',
      status: 'error',
    })
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.publish).not.toHaveBeenCalled()
  })

  it('archives an existing record without reparsing editorial fields', async () => {
    const formData = new FormData()

    formData.set('intent', 'archive')

    await expect(
      submitEditorialEntryAction(
        'ARTWORK',
        '00000000-0000-4000-8000-000000000002',
        3,
        INITIAL_STUDIO_ACTION_STATE,
        formData,
      ),
    ).rejects.toThrow('NEXT_REDIRECT')
    expect(mocks.archive).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000002',
      3,
      expect.any(Object),
    )
  })

  it('returns a specific optimistic conflict message', async () => {
    mocks.update.mockRejectedValue(new EditorialVersionConflictError(3, 4))

    await expect(
      submitEditorialEntryAction(
        'ARTWORK',
        '00000000-0000-4000-8000-000000000002',
        3,
        INITIAL_STUDIO_ACTION_STATE,
        validArtworkData(),
      ),
    ).resolves.toMatchObject({
      message: 'This record changed in another session. Reload before saving.',
      status: 'error',
    })
  })

  it('redacts an unexpected persistence failure', async () => {
    mocks.create.mockRejectedValue(new Error('postgresql://secret@database'))

    await expect(
      submitEditorialEntryAction(
        'ARTWORK',
        null,
        null,
        INITIAL_STUDIO_ACTION_STATE,
        validArtworkData(),
      ),
    ).resolves.toEqual({
      fieldErrors: {},
      message: 'The editorial change could not be saved. Try again.',
      status: 'error',
    })
  })

  it('saves the current edit before publishing its immutable revision', async () => {
    mocks.update.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000002',
      locale: 'en',
      slug: 'winter-light',
      version: 4,
    })
    mocks.publish.mockResolvedValue({revision: {version: 5}})

    await expect(
      submitEditorialEntryAction(
        'ARTWORK',
        '00000000-0000-4000-8000-000000000002',
        3,
        INITIAL_STUDIO_ACTION_STATE,
        validArtworkData('publish'),
      ),
    ).rejects.toThrow('NEXT_REDIRECT')

    expect(mocks.update).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000002',
      expect.objectContaining({expectedVersion: 3}),
      expect.any(Object),
    )
    expect(mocks.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: '00000000-0000-4000-8000-000000000002',
        entityType: 'ARTWORK',
        expectedVersion: 4,
      }),
    )
  })

  it('reloads the saved draft version when publication validation fails', async () => {
    mocks.update.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000002',
      locale: 'en',
      slug: 'winter-light',
      version: 4,
    })
    mocks.publish.mockRejectedValue(new Error('secret infrastructure detail'))

    await expect(
      submitEditorialEntryAction(
        'ARTWORK',
        '00000000-0000-4000-8000-000000000002',
        3,
        INITIAL_STUDIO_ACTION_STATE,
        validArtworkData('publish'),
      ),
    ).rejects.toThrow('NEXT_REDIRECT')
    expect(mocks.redirect).toHaveBeenCalledWith(
      '/studio/artworks/00000000-0000-4000-8000-000000000002?notice=publish-failed',
    )
    expect(mocks.redirect.mock.calls.at(-1)?.[0]).not.toContain('secret')
  })

  it('reorders an editorial list with optimistic versions', async () => {
    mocks.list.mockResolvedValue([
      {
        displayOrder: 0,
        id: '00000000-0000-4000-8000-000000000010',
        version: 2,
      },
      {
        displayOrder: 1,
        id: '00000000-0000-4000-8000-000000000011',
        version: 4,
      },
      {
        displayOrder: 2,
        id: '00000000-0000-4000-8000-000000000012',
        version: 1,
      },
    ])
    const formData = new FormData()

    formData.set('entry-id', '00000000-0000-4000-8000-000000000011')
    formData.set('direction', 'earlier')

    await expect(
      moveStudioEditorialEntryAction('ARTWORK', 'en', undefined, formData),
    ).rejects.toThrow('NEXT_REDIRECT')
    expect(mocks.reorder).toHaveBeenCalledWith(
      [
        {
          displayOrder: 0,
          expectedVersion: 4,
          id: '00000000-0000-4000-8000-000000000011',
        },
        {
          displayOrder: 1,
          expectedVersion: 2,
          id: '00000000-0000-4000-8000-000000000010',
        },
        {
          displayOrder: 2,
          expectedVersion: 1,
          id: '00000000-0000-4000-8000-000000000012',
        },
      ],
      expect.any(Object),
    )
  })

  it('restores a historical revision as a new immutable version', async () => {
    const formData = new FormData()

    formData.set('revision-id', '00000000-0000-4000-8000-000000000020')
    mocks.restore.mockResolvedValue({revision: {version: 8}})

    await expect(
      restoreStudioEditorialRevisionAction(
        'ARTWORK',
        '00000000-0000-4000-8000-000000000002',
        7,
        'en',
        'winter-light',
        formData,
      ),
    ).rejects.toThrow('NEXT_REDIRECT')
    expect(mocks.restore).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: '00000000-0000-4000-8000-000000000002',
        entityType: 'ARTWORK',
        expectedVersion: 7,
        revisionId: '00000000-0000-4000-8000-000000000020',
      }),
    )
  })
})
