import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({list: vi.fn()}))

vi.mock('@/server/studio-inquiries/configured-studio-inquiry-service', () => ({
  configuredStudioInquiryService: {list: mocks.list},
}))

import StudioInquiriesPage from './page'

describe('Studio inquiry inbox page', () => {
  it('lists filtered collector requests from the database service', async () => {
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
      '/studio/inquiries/00000000-0000-4000-8000-000000000002',
    )
    expect(screen.getByText('Winter Light')).toBeVisible()
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({status: 'NEW', type: 'AVAILABILITY'}),
    )
  })
})
