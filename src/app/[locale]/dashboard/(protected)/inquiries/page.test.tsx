import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  requireStudioEditor: vi.fn(),
}))

vi.mock('@/server/studio-inquiries/configured-studio-inquiry-service', () => ({
  configuredStudioInquiryService: {list: mocks.list},
}))
vi.mock('@/server/studio-auth/configured-access', () => ({
  requireStudioEditor: mocks.requireStudioEditor,
}))

import StudioInquiriesPage from './page'

describe('Studio inquiry inbox page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists filtered collector requests from the database service', async () => {
    mocks.requireStudioEditor.mockResolvedValue({
      id: 'editor-1',
      role: 'EDITOR',
    })
    mocks.list.mockResolvedValue([
      {
        createdAt: new Date('2026-08-11T08:00:00.000Z'),
        email: 'collector@example.com',
        id: '00000000-0000-4000-8000-000000000002',
        labels: ['priority'],
        locale: 'en',
        name: 'A Collector',
        relatedArtworkTitle: 'Winter Light',
        status: 'NEW',
        subject: null,
        type: 'AVAILABILITY',
        updatedAt: new Date('2026-08-11T08:00:00.000Z'),
      },
    ])

    render(
      await StudioInquiriesPage({
        searchParams: Promise.resolve({status: 'NEW', type: 'AVAILABILITY'}),
      } as never),
    )

    expect(screen.getByRole('heading', {name: 'Inquiry inbox'})).toBeVisible()
    expect(screen.getByRole('link', {name: 'A Collector'})).toHaveAttribute(
      'href',
      '/dashboard/inquiries/00000000-0000-4000-8000-000000000002',
    )
    expect(screen.getByText('Winter Light')).toBeVisible()
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({status: 'NEW', type: 'AVAILABILITY'}),
    )
    expect(mocks.requireStudioEditor).toHaveBeenCalledOnce()
  })

  it('does not load inquiry PII after editor access is revoked', async () => {
    mocks.requireStudioEditor.mockRejectedValueOnce(new Error('FORBIDDEN'))

    await expect(
      StudioInquiriesPage({searchParams: Promise.resolve({})} as never),
    ).rejects.toThrow('FORBIDDEN')
    expect(mocks.list).not.toHaveBeenCalled()
  })
})
