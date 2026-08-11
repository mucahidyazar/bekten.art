import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {PublicArtworkGrid} from './public-artwork-grid'
import {PublicEditorialCard} from './public-editorial-card'

import type {PublicArtwork} from '@/server/public-editorial'

const artwork = {
  availability: 'ON_REQUEST',
  collectionId: null,
  description: 'A quiet study of memory and the steppe.',
  dimensions: '100 × 80 cm',
  displayOrder: 0,
  id: '10000000-0000-4000-8000-000000000001',
  locale: 'en',
  medium: 'Oil on canvas',
  mediaPlacements: [
    {
      altText: 'Ochre and blue figures crossing the steppe',
      caption: null,
      credit: 'Bekten Studio',
      crop: 'ORIGINAL',
      displayOrder: 0,
      focalPoint: {x: 0.5, y: 0.5},
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
    canonicalPath: '/en/works/silent-steppe',
    description: 'A quiet study of memory and the steppe.',
    noIndex: false,
    title: 'Silent Steppe',
  },
  slug: 'silent-steppe',
  title: 'Silent Steppe',
  year: 2026,
} as unknown as PublicArtwork

describe('public editorial display', () => {
  it('renders artwork as a semantic, locale-aware archive grid without commerce', () => {
    render(<PublicArtworkGrid locale="en" works={[artwork]} />)

    expect(screen.getByRole('list')).toBeVisible()
    expect(screen.getByRole('link', {name: /silent steppe/iu})).toHaveAttribute(
      'href',
      '/works/silent-steppe',
    )
    expect(
      screen.getByRole('img', {
        name: 'Ochre and blue figures crossing the steppe',
      }),
    ).toBeVisible()
    expect(screen.getByText('Oil on canvas')).toBeVisible()
    expect(screen.getByText('On request')).toBeVisible()
    expect(screen.queryByText(/price|buy|cart|checkout/iu)).toBeNull()
  })

  it('uses the reusable editorial card for non-artwork publications', () => {
    render(
      <PublicEditorialCard
        actionLabel="View exhibition"
        description="A new body of work shaped by memory."
        eyebrow="Exhibition · 2026"
        href="/en/exhibitions/echoes"
        media={artwork.mediaPlacements[0]}
        title="Echoes of the Steppe"
      />,
    )

    expect(screen.getByRole('article')).toBeVisible()
    expect(
      screen.getByRole('link', {name: /echoes of the steppe/iu}),
    ).toHaveAttribute('href', '/en/exhibitions/echoes')
    expect(screen.getByText('Exhibition · 2026')).toBeVisible()
    expect(screen.getByText('View exhibition')).toBeVisible()
  })

  it('communicates reserved availability without exposing a price', () => {
    render(
      <PublicArtworkGrid
        locale="en"
        works={[{...artwork, availability: 'RESERVED'}]}
      />,
    )

    expect(screen.getByText('Reserved')).toBeVisible()
    expect(screen.queryByText(/price|buy|cart|checkout/iu)).toBeNull()
  })

  it('offers a premium inquiry path without introducing commerce claims', () => {
    render(
      <PublicArtworkGrid
        actionLabel="Availability inquiry"
        locale="en"
        works={[artwork]}
      />,
    )

    expect(
      screen.getByRole('link', {name: 'Availability inquiry'}),
    ).toHaveAttribute('href', '/works/silent-steppe#availability-inquiry')
    expect(screen.queryByText(/price|shipping|certificate/iu)).toBeNull()
  })
})
