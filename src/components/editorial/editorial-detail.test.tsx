import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {EditorialDetail} from './editorial-detail'

const heroId = '00000000-0000-4000-8000-000000000001'
const galleryId = '00000000-0000-4000-8000-000000000002'

describe('EditorialDetail', () => {
  it('renders the same complete artwork presentation for previews and public pages', () => {
    render(
      <EditorialDetail
        content={{
          availability: 'ON_REQUEST',
          description:
            'A material study of landscape, memory, and inherited visual language.',
          dimensions: '120 × 90 cm',
          locale: 'en',
          mediaPlacements: [
            {
              altText: 'Ochre and charcoal forms layered across a linen canvas',
              caption: 'Studio view, 2026',
              credit: 'Bekten Studio archive',
              crop: 'ORIGINAL',
              displayOrder: 0,
              focalPoint: null,
              mediaObjectId: heroId,
              role: 'HERO',
            },
            {
              altText: 'Detail of mineral pigment texture',
              caption: null,
              credit: null,
              crop: 'SQUARE',
              displayOrder: 1,
              focalPoint: null,
              mediaObjectId: galleryId,
              role: 'GALLERY',
            },
          ],
          medium: 'Oil and mineral pigment on canvas',
          title: 'Silent Steppe',
          year: 2026,
        }}
        entityLabel="Artwork"
        headingId="artwork-title"
      />,
    )

    expect(screen.getByRole('heading', {name: 'Silent Steppe'})).toBeVisible()
    expect(screen.getByText('Oil and mineral pigment on canvas')).toBeVisible()
    expect(screen.getByText('120 × 90 cm')).toBeVisible()
    expect(screen.getByText('On request')).toBeVisible()
    expect(
      screen.getByRole('img', {
        name: 'Ochre and charcoal forms layered across a linen canvas',
      }),
    ).toHaveAttribute('src', expect.stringContaining(`/api/media/${heroId}`))
    expect(
      screen.getByRole('img', {name: 'Detail of mineral pigment texture'}),
    ).toBeVisible()
    expect(screen.getByText('Studio view, 2026')).toBeVisible()
    expect(screen.getByText('Bekten Studio archive')).toBeVisible()
  })

  it('renders exhibition chronology and body without artwork-only metadata', () => {
    render(
      <EditorialDetail
        content={{
          body: 'The exhibition brings together recent paintings and archival studies.',
          city: 'Bishkek',
          country: 'Kyrgyzstan',
          endsAt: new Date('2026-10-20T00:00:00.000Z'),
          locale: 'en',
          mediaPlacements: [],
          startsAt: new Date('2026-09-10T00:00:00.000Z'),
          subtitle: 'A study in inherited landscapes',
          title: 'Earth Memory',
          venue: 'National Museum',
        }}
        entityLabel="Exhibition"
        headingId="exhibition-title"
      />,
    )

    expect(screen.getByText('A study in inherited landscapes')).toBeVisible()
    expect(screen.getByText(/National Museum/)).toBeVisible()
    expect(screen.getByText(/Bishkek, Kyrgyzstan/)).toBeVisible()
    expect(
      screen.getByText(
        'The exhibition brings together recent paintings and archival studies.',
      ),
    ).toBeVisible()
    expect(screen.queryByText('Availability')).not.toBeInTheDocument()
  })

  it('preserves page eyebrow and complete press attribution metadata', () => {
    const {rerender} = render(
      <EditorialDetail
        content={{
          body: 'A long-form account of the studio and its working archive.',
          eyebrow: 'The studio',
          locale: 'en',
          mediaPlacements: [],
          title: 'A living archive',
        }}
        entityLabel="Page"
        headingId="page-title"
      />,
    )

    expect(screen.getByText('Page · The studio')).toBeVisible()

    rerender(
      <EditorialDetail
        content={{
          body: 'The full interview transcript remains connected to its source.',
          excerpt:
            'A conversation about the material memory carried by Bekten’s paintings.',
          locale: 'en',
          mediaPlacements: [],
          outlet: 'Art Review Quarterly',
          pressCategory: 'INTERVIEW',
          publishedOn: new Date('2026-08-01T00:00:00.000Z'),
          sourceUrl: 'https://example.com/interviews/bekten',
          subtitle: 'In conversation',
          title: 'Landscapes remembered',
        }}
        entityLabel="Press entry"
        headingId="press-title"
      />,
    )

    expect(screen.getByText('Interview')).toBeVisible()
    expect(
      screen.getByRole('link', {name: 'Read original source'}),
    ).toHaveAttribute('href', 'https://example.com/interviews/bekten')
    expect(screen.getByText('Art Review Quarterly')).toBeVisible()
  })
})
