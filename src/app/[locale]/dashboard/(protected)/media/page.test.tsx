import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  mediaFolderFindMany: vi.fn(),
  mediaObjectCount: vi.fn(),
  mediaObjectFindMany: vi.fn(),
  refresh: vi.fn(),
  requireStudioEditor: vi.fn(),
}))

vi.mock('next/navigation', () => ({useRouter: () => mocks}))
vi.mock('@/lib/db', () => ({
  prisma: {
    mediaFolder: {findMany: mocks.mediaFolderFindMany},
    mediaObject: {
      count: mocks.mediaObjectCount,
      findMany: mocks.mediaObjectFindMany,
    },
  },
}))
vi.mock('@/server/studio-auth/configured-access', () => ({
  requireStudioEditor: mocks.requireStudioEditor,
}))

import StudioMediaPage from './page'

describe('Studio media page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mediaFolderFindMany.mockResolvedValue([])
    mocks.mediaObjectCount.mockResolvedValue(0)
  })

  it('reads Garage media and reserves deletion for owners', async () => {
    mocks.requireStudioEditor.mockResolvedValue({id: 'owner-1', role: 'OWNER'})
    mocks.mediaObjectFindMany.mockResolvedValue([
      {
        createdAt: new Date('2026-08-11T08:00:00.000Z'),
        displayName: 'winter-light.webp',
        filename: 'winter-light.webp',
        folderId: null,
        height: 1200,
        id: '00000000-0000-4000-8000-000000000002',
        sizeBytes: 204800,
        status: 'READY',
        version: 1,
        width: 1600,
      },
    ])
    mocks.mediaObjectCount.mockResolvedValue(1)

    render(await StudioMediaPage())

    expect(screen.getByRole('heading', {name: 'Media library'})).toBeVisible()
    expect(
      screen.getByRole('button', {name: 'Delete winter-light.webp'}),
    ).toBeVisible()
    expect(mocks.mediaObjectFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 101,
        where: {
          provider: 'garage',
          status: {in: ['READY', 'FAILED', 'QUARANTINED']},
        },
      }),
    )
  })

  it('limits editors to ready public media', async () => {
    mocks.requireStudioEditor.mockResolvedValue({
      id: 'editor-1',
      role: 'EDITOR',
    })
    mocks.mediaObjectFindMany.mockResolvedValue([])

    render(await StudioMediaPage())

    expect(mocks.mediaObjectFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          provider: 'garage',
          status: 'READY',
          visibility: 'PUBLIC',
        },
      }),
    )
    expect(screen.queryByRole('button', {name: /delete/i})).toBeNull()
  })
})
