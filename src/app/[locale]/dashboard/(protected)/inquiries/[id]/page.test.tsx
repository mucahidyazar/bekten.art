import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({findById: vi.fn()}))

vi.mock('@/server/studio-inquiries/configured-studio-inquiry-service', () => ({
  configuredStudioInquiryService: {findById: mocks.findById},
}))
vi.mock('../inquiry-actions', () => ({
  updateStudioInquiryAction: vi.fn(async (_id, state) => state),
}))

import StudioInquiryDetailPage from './page'

describe('Studio inquiry detail page', () => {
  it('maps the private database record into the inbox detail experience', async () => {
    mocks.findById.mockResolvedValue({
      brief: null,
      createdAt: new Date('2026-08-11T08:00:00.000Z'),
      email: 'collector@example.com',
      id: '00000000-0000-4000-8000-000000000002',
      internalNotes: [
        {
          authorUser: {email: 'editor@example.com', name: 'Studio Editor'},
          body: 'Initial follow-up prepared.',
          createdAt: new Date('2026-08-11T09:00:00.000Z'),
          id: '00000000-0000-4000-8000-000000000003',
        },
      ],
      labels: ['priority'],
      locale: 'en',
      message: 'I would like to arrange a private viewing next month.',
      name: 'A Collector',
      phone: null,
      preferredTimeline: null,
      relatedArtworkTitle: 'Winter Light',
      status: 'NEW',
      subject: null,
      type: 'PRIVATE_VIEWING',
    })

    render(
      await StudioInquiryDetailPage({
        params: Promise.resolve({
          id: '00000000-0000-4000-8000-000000000002',
        }),
      } as never),
    )

    expect(screen.getByRole('heading', {name: 'A Collector'})).toBeVisible()
    expect(screen.getByText('Initial follow-up prepared.')).toBeVisible()
  })
})
