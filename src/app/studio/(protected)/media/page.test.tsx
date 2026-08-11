import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  refresh: vi.fn(),
  requireStudioEditor: vi.fn(),
}))

vi.mock('next/navigation', () => ({useRouter: () => mocks}))
vi.mock('@/lib/db', () => ({prisma: {mediaObject: {findMany: mocks.findMany}}}))
vi.mock('@/server/studio-auth/configured-access', () => ({
  requireStudioEditor: mocks.requireStudioEditor,
}))

import StudioMediaPage from './page'

describe('Studio media page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads Garage media and reserves deletion for owners', async () => {
    mocks.requireStudioEditor.mockResolvedValue({id: 'owner-1', role: 'OWNER'})
    mocks.findMany.mockResolvedValue([
      {
        createdAt: new Date('2026-08-11T08:00:00.000Z'),
        filename: 'winter-light.webp',
        height: 1200,
        id: '00000000-0000-4000-8000-000000000002',
        sizeBytes: 204800,
        status: 'READY',
        width: 1600,
      },
    ])

    render(await StudioMediaPage())

    expect(screen.getByRole('heading', {name: 'Media library'})).toBeVisible()
    expect(
      screen.getByRole('button', {name: 'Delete winter-light.webp'}),
    ).toBeVisible()
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
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
    mocks.findMany.mockResolvedValue([])

    render(await StudioMediaPage())

    expect(mocks.findMany).toHaveBeenCalledWith(
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
