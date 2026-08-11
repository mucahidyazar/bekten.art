import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import ArchivePage, {generateMetadata} from './page'

const listWorks = vi.hoisted(() => vi.fn())

vi.mock('@/server/public-editorial', () => ({
  publicEditorialReader: {listWorks},
}))
vi.mock('@/utils/prepare-metadata', () => ({
  prepareMetadata: vi.fn((metadata: unknown) => metadata),
}))

describe('V2 public archive', () => {
  it('renders only real published works returned by the editorial reader', async () => {
    listWorks.mockResolvedValueOnce([
      {
        availability: 'NOT_AVAILABLE',
        collectionId: null,
        description: 'An archived work held in the studio record.',
        dimensions: '80 × 60 cm',
        displayOrder: 0,
        id: '10000000-0000-4000-8000-000000000001',
        locale: 'en',
        medium: 'Oil on canvas',
        mediaPlacements: [],
        publishedAt: '2026-08-11T00:00:00.000Z',
        seo: {
          canonicalPath: '/en/works/archive-study',
          description: 'An archived work held in the studio record.',
          noIndex: false,
          title: 'Archive Study',
        },
        slug: 'archive-study',
        title: 'Archive Study',
        year: 1998,
      },
      {
        availability: 'NOT_AVAILABLE',
        collectionId: null,
        description: 'A second published work from another year.',
        dimensions: '90 × 70 cm',
        displayOrder: 1,
        id: '10000000-0000-4000-8000-000000000002',
        locale: 'en',
        medium: 'Oil on canvas',
        mediaPlacements: [],
        publishedAt: '2026-08-11T00:00:00.000Z',
        seo: {
          canonicalPath: '/en/works/second-archive-study',
          description: 'A second published work from another year.',
          noIndex: false,
          title: 'Second Archive Study',
        },
        slug: 'second-archive-study',
        title: 'Second Archive Study',
        year: 2004,
      },
    ])

    render(await ArchivePage({params: Promise.resolve({locale: 'en'})}))

    expect(
      screen.getByRole('heading', {level: 1, name: 'Archive'}),
    ).toBeVisible()
    expect(
      screen.getByRole('link', {name: /^archive study$/iu}),
    ).toHaveAttribute('href', '/works/archive-study')
    expect(screen.getAllByText('In archive')).toHaveLength(2)
    expect(screen.getByRole('heading', {level: 2, name: '2004'})).toBeVisible()
    expect(screen.getByRole('heading', {level: 2, name: '1998'})).toBeVisible()
    expect(screen.getByRole('region', {name: 'Works from 2004'})).toBeVisible()
    expect(document.querySelector('[data-public-editorial-hero]')).toBeVisible()
    expect(screen.queryByText(/price|buy|cart|checkout/iu)).toBeNull()
  })

  it('uses the prefixless English archive canonical path', async () => {
    await expect(
      generateMetadata({params: Promise.resolve({locale: 'en'})}),
    ).resolves.toMatchObject({alternates: {canonical: '/archive'}})
  })
})
