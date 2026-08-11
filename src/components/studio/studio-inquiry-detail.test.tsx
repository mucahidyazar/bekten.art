import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {StudioInquiryDetail} from './studio-inquiry-detail'

describe('StudioInquiryDetail', () => {
  it('shows collector context and an accessible private workflow form', () => {
    render(
      <StudioInquiryDetail
        action={vi.fn(async state => state)}
        inquiry={{
          createdAt: '2026-08-11T08:00:00.000Z',
          email: 'collector@example.com',
          labels: ['priority'],
          locale: 'en',
          message: 'I would like to arrange a private viewing next month.',
          name: 'A Collector',
          phone: '+90 555 000 00 00',
          relatedArtworkTitle: 'Winter Light',
          status: 'NEW',
          type: 'PRIVATE_VIEWING',
        }}
        notes={[
          {
            author: 'Studio Editor',
            body: 'Initial follow-up prepared.',
            createdAt: '2026-08-11T09:00:00.000Z',
            id: '00000000-0000-4000-8000-000000000003',
          },
        ]}
      />,
    )

    expect(screen.getByRole('heading', {name: 'A Collector'})).toBeVisible()
    expect(
      screen.getByRole('link', {name: 'collector@example.com'}),
    ).toHaveAttribute('href', 'mailto:collector@example.com')
    expect(screen.getByLabelText('Inquiry status')).toHaveValue('NEW')
    expect(screen.getByLabelText('Labels')).toHaveValue('priority')
    expect(screen.getByLabelText('Add private note')).toBeVisible()
    expect(screen.getByText('Initial follow-up prepared.')).toBeVisible()
    expect(screen.getByRole('button', {name: 'Save inquiry'})).toBeVisible()
  })

  it('renders commission context and the empty private-note state', () => {
    render(
      <StudioInquiryDetail
        action={vi.fn(async state => state)}
        inquiry={{
          brief:
            'A commission exploring mountain memory through layered natural pigments.',
          createdAt: '2026-08-11T08:00:00.000Z',
          email: 'collector@example.com',
          labels: [],
          locale: 'tr',
          message: null,
          name: 'A Collector',
          phone: null,
          preferredTimeline: 'Spring 2027',
          relatedArtworkTitle: null,
          status: 'IN_REVIEW',
          subject: 'Commission request',
          type: 'COMMISSION',
        }}
        notes={[]}
      />,
    )

    expect(screen.getByText('Not provided')).toBeVisible()
    expect(screen.getByText('Spring 2027')).toBeVisible()
    expect(screen.getByText('Commission request')).toBeVisible()
    expect(screen.getByText('No private notes yet.')).toBeVisible()
  })
})
