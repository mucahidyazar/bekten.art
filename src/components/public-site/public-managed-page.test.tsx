import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {PublicManagedPage} from './public-managed-page'

import type {PublicPage} from '@/server/public-editorial'

const page = {
  body: 'Bekten works between inherited memory and the changing landscape.\n\nThe studio archive follows this practice across time.',
  eyebrow: 'Practice',
  id: '10000000-0000-4000-8000-000000000010',
  locale: 'en',
  mediaPlacements: [
    {
      altText: 'Bekten working beside a large canvas',
      caption: 'Inside the studio',
      credit: 'Bekten Studio',
      crop: 'ORIGINAL',
      displayOrder: 0,
      focalPoint: null,
      height: 1200,
      mediaObjectId: '50000000-0000-4000-8000-000000000001',
      mimeType: 'image/png',
      role: 'HERO',
      url: '/api/media/50000000-0000-4000-8000-000000000001',
      width: 960,
    },
  ],
  publishedAt: '2026-08-11T00:00:00.000Z',
  seo: {
    canonicalPath: '/en/artist',
    description: 'A detailed introduction to Bekten and the studio practice.',
    noIndex: false,
    title: 'The artist',
  },
  slug: 'artist',
  title: 'The artist',
} as PublicPage

describe('PublicManagedPage', () => {
  it('renders published Studio copy as a restrained editorial story', () => {
    render(<PublicManagedPage page={page} />)

    expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1)
    expect(screen.getByRole('heading', {name: 'The artist'})).toBeVisible()
    expect(screen.getByText('Practice')).toBeVisible()
    expect(
      screen.getByRole('img', {name: 'Bekten working beside a large canvas'}),
    ).toBeVisible()
    expect(screen.getByText(/changing landscape/iu)).toBeVisible()
    expect(screen.getByText(/archive follows this practice/iu)).toBeVisible()
    expect(screen.queryByText(/price|buy|cart|checkout/iu)).toBeNull()
  })

  it('provides a labelled continuation region for a route-specific inquiry', () => {
    render(
      <PublicManagedPage page={page}>
        <section aria-label="Commission inquiry">Inquiry form</section>
      </PublicManagedPage>,
    )

    expect(
      screen.getByRole('region', {name: 'Commission inquiry'}),
    ).toBeVisible()
  })
})
