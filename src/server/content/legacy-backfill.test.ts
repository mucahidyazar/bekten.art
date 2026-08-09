import {describe, expect, it} from 'vitest'

import {
  buildTypedContentRows,
  deterministicUuid,
  toSlug,
} from '../../../scripts/lib/legacy-content-backfill.mjs'

const legacyRows = [
  {
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    data: {
      availability: 'available',
      currency: 'usd',
      description: 'A detailed original painting.',
      dimensions: {height: 80, unit: 'cm', width: 60},
      imageUrl: '/api/media/3f64d9de-8f45-4ebd-b8ff-0384e287acb1',
      medium: 'Oil on canvas',
      price: 125.5,
      title: 'Mountain Light',
      year: 2024,
    },
    id: '3f64d9de-8f45-4ebd-b8ff-0384e287acb1',
    is_active: true,
    order: 2,
    section_type: 'store',
    updated_at: new Date('2024-02-01T00:00:00.000Z'),
  },
  {
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    data: {
      category: 'businessman',
      company: 'Studio',
      location: 'Bishkek',
      name: 'Collector',
      quote: 'A thoughtful and enduring body of work.',
      title: 'Founder',
    },
    id: '4379de47-012d-4f0b-b66a-1ed06cb65e36',
    is_active: false,
    order: 1,
    section_type: 'testimonials',
    updated_at: new Date('2024-02-01T00:00:00.000Z'),
  },
] as const

describe('legacy content backfill', () => {
  it('creates deterministic RFC-4122 UUIDs without reusing the legacy id', () => {
    const first = deterministicUuid('artwork:en:legacy-id')

    expect(first).toBe(deterministicUuid('artwork:en:legacy-id'))
    expect(first).not.toBe(deterministicUuid('artwork:tr:legacy-id'))
    expect(first).toMatch(
      /^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
    )
  })

  it('produces stable, bounded slugs with a fallback for non-Latin titles', () => {
    expect(toSlug('Mountain Light', 'abcdef12')).toBe(
      'mountain-light-abcdef12',
    )
    expect(toSlug('Кыргыз сүрөтү', 'abcdef12')).toBe('item-abcdef12')
    expect(toSlug('x'.repeat(300), 'abcdef12')).toHaveLength(160)
  })

  it('maps every legacy item to each locale and preserves publication state', () => {
    const result = buildTypedContentRows(legacyRows, ['en', 'tr'] as const)

    expect(result.artworks).toHaveLength(2)
    expect(result.testimonials).toHaveLength(2)
    expect(result.artworks[0]).toMatchObject({
      currency: 'USD',
      dimensions: '60 × 80 cm',
      imageAlt: 'Mountain Light',
      isAvailable: true,
      locale: 'en',
      priceMinor: 12_550,
      publishedAt: new Date('2024-02-01T00:00:00.000Z'),
      status: 'PUBLISHED',
    })
    expect(result.testimonials[0]).toMatchObject({
      category: 'BUSINESSPERSON',
      locale: 'en',
      publishedAt: null,
      status: 'ARCHIVED',
    })
  })

  it('fails closed for unsupported section types', () => {
    expect(() =>
      buildTypedContentRows(
        [
          {
            ...legacyRows[0],
            section_type: 'gallery',
          },
        ],
        ['en'],
      ),
    ).toThrow('Unsupported legacy section type: gallery')
  })

  it('drops known placeholders and third-party hotlinks from typed content', () => {
    const placeholderArtwork = {
      ...legacyRows[0],
      data: {
        ...legacyRows[0].data,
        imageUrl: '/img/empty-event-image.png',
      },
    }
    const remoteNews = {
      created_at: new Date('2024-01-01T00:00:00.000Z'),
      data: {
        category: 'news',
        description: 'A real archived article.',
        image: 'https://24.kg/files/media/17/17236.jpg',
        title: 'Archive report',
      },
      id: 'f4b943fa-bcff-4c1b-8434-ab745c7fc79d',
      is_active: true,
      order: 3,
      section_type: 'news',
      updated_at: new Date('2024-02-01T00:00:00.000Z'),
    }

    const result = buildTypedContentRows(
      [placeholderArtwork, remoteNews],
      ['en'],
    )

    expect(result.artworks).toEqual([])
    expect(result.newsArticles).toHaveLength(1)
    expect(result.newsArticles[0]).toMatchObject({
      imageAlt: null,
      imageUrl: null,
      objectKey: null,
    })
  })
})
