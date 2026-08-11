import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import Home from './page'

const getHomepage = vi.hoisted(() => vi.fn())

vi.mock('@/server/public-editorial', () => ({
  publicEditorialReader: {getHomepage},
}))
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))
vi.mock('@/utils/prepare-metadata', () => ({prepareMetadata: vi.fn()}))

const media = {
  altText: 'An ochre artwork with figures crossing the steppe',
  caption: null,
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
}
const work = {
  availability: 'ON_REQUEST',
  collectionId: null,
  description: 'A layered work about memory and place.',
  dimensions: '100 × 80 cm',
  displayOrder: 0,
  id: '10000000-0000-4000-8000-000000000001',
  locale: 'en',
  medium: 'Oil on canvas',
  mediaPlacements: [media],
  publishedAt: '2026-08-11T00:00:00.000Z',
  seo: {
    canonicalPath: '/en/works/silent-steppe',
    description: 'A work.',
    noIndex: false,
    title: 'A work.',
  },
  slug: 'silent-steppe',
  title: 'Silent Steppe',
  year: 2026,
}

describe('V2 editorial homepage', () => {
  it('leads with published artwork and premium editorial discovery', async () => {
    getHomepage.mockResolvedValueOnce({
      collections: [],
      exhibitions: [],
      hero: work,
      journalEntries: [],
      pressEntries: [],
      works: [work],
    })

    render(await Home({params: Promise.resolve({locale: 'en'})}))

    expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1)
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
      'Art that remembers',
    )
    expect(
      screen.getAllByRole('img', {
        name: 'An ochre artwork with figures crossing the steppe',
      }),
    ).toHaveLength(2)
    expect(screen.getByRole('link', {name: 'Explore works'})).toHaveAttribute(
      'href',
      '/works',
    )
    expect(screen.getByRole('heading', {name: 'Selected works'})).toBeVisible()
    expect(screen.getByRole('link', {name: /silent steppe/iu})).toHaveAttribute(
      'href',
      '/works/silent-steppe',
    )
    expect(
      screen.getByRole('heading', {name: 'About the artist'}),
    ).toBeVisible()
    expect(
      screen.getByRole('link', {name: 'Discover the artist'}),
    ).toHaveAttribute('href', '/about')
    expect(screen.queryByText(/buy|price|cart|checkout/iu)).toBeNull()
  })

  it('localizes editorial section labels', async () => {
    getHomepage.mockResolvedValueOnce({
      collections: [],
      exhibitions: [],
      hero: null,
      journalEntries: [],
      pressEntries: [],
      works: [],
    })

    render(await Home({params: Promise.resolve({locale: 'tr'})}))

    expect(screen.getByText('01 · Arşiv')).toBeVisible()
    expect(screen.queryByText('01 · Archive')).toBeNull()
  })
})
