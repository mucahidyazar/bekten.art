import {describe, expect, it} from 'vitest'

import {
  artworkEditSchema,
  artworkPublicSchema,
  artworkRecordSchema,
  collectionEditSchema,
  collectionPublicSchema,
  exhibitionEditSchema,
  exhibitionPublicSchema,
  journalEntryEditSchema,
  journalEntryPublicSchema,
  pageEditSchema,
  pagePublicSchema,
  pageRecordSchema,
  pressEntryEditSchema,
  pressEntryPublicSchema,
} from './editorial-contracts'

const editableMetadata = {
  displayOrder: 0,
  locale: 'en' as const,
  slug: 'editorial-heritage',
}

const seo = {
  canonicalPath: '/en/artworks/editorial-heritage',
  description:
    'An archival artwork presented through the Bekten Studio editorial collection.',
  noIndex: false,
  title: 'Editorial Heritage — Bekten Studio',
}

const mediaPlacements = [
  {
    altText: 'A layered abstract composition in ochre and charcoal',
    caption: 'Editorial Heritage, 2026',
    credit: 'Bekten Studio archive',
    displayOrder: 0,
    focalPoint: {x: 0.45, y: 0.4},
    mediaObjectId: 'c33944f3-b5d8-49ed-a5cb-2e701a91be3c',
    role: 'HERO' as const,
  },
]

describe('editorial content contracts', () => {
  it.each(['en', 'tr', 'ru', 'ky'] as const)(
    'accepts the supported %s locale',
    locale => {
      const result = pageEditSchema.parse({
        ...editableMetadata,
        body: 'A sufficiently complete editorial page body for publication.',
        locale,
        mediaPlacements: [],
        seo,
        title: 'The Studio',
      })

      expect(result.locale).toBe(locale)
    },
  )

  it('rejects unsupported locales and non-kebab slugs', () => {
    const basePage = {
      ...editableMetadata,
      body: 'A sufficiently complete editorial page body for publication.',
      mediaPlacements: [],
      seo,
      title: 'The Studio',
    }

    expect(() => pageEditSchema.parse({...basePage, locale: 'de'})).toThrow()
    expect(() => pageEditSchema.parse({...basePage, slug: 'The Studio'})).toThrow()
    expect(() => pageEditSchema.parse({...basePage, slug: 'the--studio'})).toThrow()
  })

  it('keeps lifecycle validation on records and bounds edit ordering', () => {
    const basePage = {
      ...editableMetadata,
      body: 'A sufficiently complete editorial page body for publication.',
      mediaPlacements: [],
      seo,
      title: 'The Studio',
    }
    const recordMetadata = {
      createdAt: new Date('2026-08-10T10:00:00.000Z'),
      id: '71bbddf7-fc48-4395-8f36-9699410ced8a',
      updatedAt: new Date('2026-08-10T10:00:00.000Z'),
      version: 1,
    }

    expect(() =>
      pageRecordSchema.parse({
        ...basePage,
        ...recordMetadata,
        publishedAt: null,
        status: 'PUBLISHED',
      }),
    ).toThrow()
    expect(() =>
      pageEditSchema.parse({...basePage, displayOrder: -1}),
    ).toThrow()
    expect(() =>
      pageEditSchema.parse({...basePage, displayOrder: 1.5}),
    ).toThrow()
  })

  it('validates accessible structured media placements', () => {
    const baseArtwork = {
      ...editableMetadata,
      availability: 'ON_REQUEST' as const,
      collectionId: null,
      description:
        'A sufficiently complete description of the artwork and its material history.',
      dimensions: '120 × 90 cm',
      mediaPlacements,
      medium: 'Oil and mineral pigment on canvas',
      seo,
      title: 'Editorial Heritage',
      year: 2026,
    }

    expect(artworkEditSchema.parse(baseArtwork).mediaPlacements).toHaveLength(1)
    expect(() =>
      artworkEditSchema.parse({
        ...baseArtwork,
        mediaPlacements: [{...mediaPlacements[0], altText: ''}],
      }),
    ).toThrow()
    expect(() =>
      artworkEditSchema.parse({
        ...baseArtwork,
        mediaPlacements: [
          mediaPlacements[0],
          {
            ...mediaPlacements[0],
            mediaObjectId: 'e08a5a02-20dc-4525-a3f8-dffb685e036d',
            role: 'GALLERY',
          },
        ],
      }),
    ).toThrow()
    expect(() =>
      artworkEditSchema.parse({
        ...baseArtwork,
        mediaPlacements: [
          {...mediaPlacements[0], focalPoint: {x: 1.1, y: 0.4}},
        ],
      }),
    ).toThrow()
  })

  it('keeps artwork edit contracts price-free', () => {
    const artwork = {
      ...editableMetadata,
      availability: 'AVAILABLE' as const,
      description:
        'A sufficiently complete description of the artwork and its material history.',
      mediaPlacements,
      seo,
      title: 'Editorial Heritage',
    }

    expect(artworkEditSchema.parse(artwork)).not.toHaveProperty('priceMinor')
    expect(() =>
      artworkEditSchema.parse({
        ...artwork,
        currency: 'EUR',
        priceMinor: 500_000,
      }),
    ).toThrow()

    const publicArtwork = {
      availability: artwork.availability,
      description: artwork.description,
      locale: artwork.locale,
      mediaPlacements,
      publishedAt: new Date('2026-08-10T10:00:00.000Z'),
      seo,
      slug: artwork.slug,
      title: artwork.title,
    }

    expect(artworkPublicSchema.parse(publicArtwork)).not.toHaveProperty(
      'priceMinor',
    )
    expect(() =>
      artworkPublicSchema.parse({...publicArtwork, priceMinor: 500_000}),
    ).toThrow()
  })

  it('accepts complete collection, exhibition, journal and press edits', () => {
    const collection = collectionEditSchema.parse({
      ...editableMetadata,
      description:
        'A focused collection tracing recurring material and cultural themes.',
      mediaPlacements,
      seo,
      title: 'Material Memory',
    })
    const exhibition = exhibitionEditSchema.parse({
      ...editableMetadata,
      body: 'A complete curatorial account of the exhibition and selected works.',
      city: 'Istanbul',
      country: 'Türkiye',
      endsAt: new Date('2026-10-20T17:00:00.000Z'),
      mediaPlacements,
      seo,
      startsAt: new Date('2026-09-10T09:00:00.000Z'),
      title: 'Lines of Memory',
      venue: 'Bekten Studio',
    })
    const journal = journalEntryEditSchema.parse({
      ...editableMetadata,
      body: 'A complete long-form journal entry about process and material memory.',
      excerpt: 'A concise introduction to process, archive, and material memory.',
      mediaPlacements,
      seo,
      title: 'Inside the Archive',
    })
    const press = pressEntryEditSchema.parse({
      ...editableMetadata,
      body: 'A complete editorial summary of the published conversation.',
      excerpt: 'A focused conversation about making art across places and generations.',
      mediaPlacements,
      outlet: 'Art Review',
      pressCategory: 'INTERVIEW',
      publishedOn: new Date('2026-07-15T00:00:00.000Z'),
      seo,
      sourceUrl: 'https://example.com/interviews/bekten',
      title: 'A Conversation with Bekten',
    })

    expect(collection.title).toBe('Material Memory')
    expect(exhibition.endsAt).toBeInstanceOf(Date)

    if (!exhibition.endsAt) {
      throw new Error('Expected a parsed exhibition end date')
    }

    expect(exhibition.endsAt.getTime()).toBeGreaterThan(
      exhibition.startsAt.getTime(),
    )
    expect(journal.excerpt).toContain('archive')
    expect(press.sourceUrl).toMatch(/^https:/)
  })

  it('rejects invalid chronology and non-HTTPS press sources', () => {
    const exhibition = {
      ...editableMetadata,
      body: 'A complete curatorial account of the exhibition and selected works.',
      endsAt: new Date('2026-08-01T00:00:00.000Z'),
      mediaPlacements: [],
      seo,
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      title: 'Lines of Memory',
      venue: 'Bekten Studio',
    }
    const press = {
      ...editableMetadata,
      excerpt: 'A focused conversation about making art across places and generations.',
      mediaPlacements: [],
      outlet: 'Art Review',
      pressCategory: 'INTERVIEW' as const,
      seo,
      sourceUrl: 'http://example.com/interviews/bekten',
      title: 'A Conversation with Bekten',
    }

    expect(() => exhibitionEditSchema.parse(exhibition)).toThrow()
    expect(() => pressEntryEditSchema.parse(press)).toThrow()
  })

  it('exposes strict public projections without Studio metadata', () => {
    const publicBase = {
      locale: editableMetadata.locale,
      mediaPlacements,
      publishedAt: new Date('2026-08-10T10:00:00.000Z'),
      seo,
      slug: editableMetadata.slug,
    }
    const projections = [
      collectionPublicSchema.parse({
        ...publicBase,
        description:
          'A focused collection tracing recurring material and cultural themes.',
        title: 'Material Memory',
      }),
      exhibitionPublicSchema.parse({
        ...publicBase,
        body: 'A complete curatorial account of the exhibition and selected works.',
        startsAt: new Date('2026-09-10T09:00:00.000Z'),
        title: 'Lines of Memory',
      }),
      journalEntryPublicSchema.parse({
        ...publicBase,
        body: 'A complete long-form journal entry about process and material memory.',
        excerpt: 'A concise introduction to process, archive, and material memory.',
        title: 'Inside the Archive',
      }),
      pagePublicSchema.parse({
        ...publicBase,
        body: 'A sufficiently complete editorial page body for publication.',
        title: 'The Studio',
      }),
      pressEntryPublicSchema.parse({
        ...publicBase,
        excerpt: 'A focused conversation about making art across places and generations.',
        outlet: 'Art Review',
        pressCategory: 'INTERVIEW',
        sourceUrl: 'https://example.com/interviews/bekten',
        title: 'A Conversation with Bekten',
      }),
    ]

    expect(projections).toHaveLength(5)
    expect(
      projections.every(
        projection =>
          !('status' in projection) && !('displayOrder' in projection),
      ),
    ).toBe(true)
    const publicBaseWithoutDate = {
      locale: publicBase.locale,
      mediaPlacements: publicBase.mediaPlacements,
      seo: publicBase.seo,
      slug: publicBase.slug,
    }

    expect(
      collectionPublicSchema.safeParse({
        ...publicBaseWithoutDate,
        description:
          'A focused collection tracing recurring material and cultural themes.',
        title: 'Material Memory',
      }).success,
    ).toBe(false)
    expect(() =>
      collectionPublicSchema.parse({
        ...publicBase,
        description:
          'A focused collection tracing recurring material and cultural themes.',
        displayOrder: 0,
        publishedAt: new Date('2026-08-10T10:00:00.000Z'),
        status: 'PUBLISHED',
        title: 'Material Memory',
      }),
    ).toThrow()
  })

  it('rejects lifecycle fields at the generic edit boundary', () => {
    const editCases: readonly {
      input: Readonly<Record<string, unknown>>
      schema: {safeParse: (input: unknown) => {success: boolean}}
    }[] = [
      {
        input: {
          ...editableMetadata,
          availability: 'ON_REQUEST',
          description:
            'A sufficiently complete description of the artwork and its material history.',
          mediaPlacements: [],
          seo,
          title: 'Editorial Heritage',
        },
        schema: artworkEditSchema,
      },
      {
        input: {
          ...editableMetadata,
          description:
            'A focused collection tracing recurring material and cultural themes.',
          mediaPlacements: [],
          seo,
          title: 'Material Memory',
        },
        schema: collectionEditSchema,
      },
      {
        input: {
          ...editableMetadata,
          body: 'A complete curatorial account of the exhibition and selected works.',
          mediaPlacements: [],
          seo,
          startsAt: new Date('2026-09-10T09:00:00.000Z'),
          title: 'Lines of Memory',
        },
        schema: exhibitionEditSchema,
      },
      {
        input: {
          ...editableMetadata,
          body: 'A complete long-form journal entry about process and material memory.',
          excerpt:
            'A concise introduction to process, archive, and material memory.',
          mediaPlacements: [],
          seo,
          title: 'Inside the Archive',
        },
        schema: journalEntryEditSchema,
      },
      {
        input: {
          ...editableMetadata,
          body: 'A sufficiently complete editorial page body for publication.',
          mediaPlacements: [],
          seo,
          title: 'The Studio',
        },
        schema: pageEditSchema,
      },
      {
        input: {
          ...editableMetadata,
          excerpt:
            'A focused conversation about making art across places and generations.',
          mediaPlacements: [],
          outlet: 'Art Review',
          pressCategory: 'INTERVIEW',
          seo,
          sourceUrl: 'https://example.com/interviews/bekten',
          title: 'A Conversation with Bekten',
        },
        schema: pressEntryEditSchema,
      },
    ]

    for (const {input, schema} of editCases) {
      expect(schema.safeParse(input).success).toBe(true)
      expect(
        schema.safeParse({
          ...input,
          publishedAt: new Date('2026-08-10T10:00:00.000Z'),
          status: 'PUBLISHED',
        }).success,
      ).toBe(false)
    }
  })

  it('allows a draft artwork without HERO but enforces HERO after publication', () => {
    const artworkFields = {
      availability: 'ON_REQUEST',
      description:
        'A sufficiently complete description of the artwork and its material history.',
      locale: 'en',
      mediaPlacements: [],
      seo,
      slug: 'editorial-heritage',
      title: 'Editorial Heritage',
    }
    const recordMetadata = {
      createdAt: new Date('2026-08-10T10:00:00.000Z'),
      id: '71bbddf7-fc48-4395-8f36-9699410ced8a',
      updatedAt: new Date('2026-08-10T10:00:00.000Z'),
      version: 1,
    }

    expect(artworkEditSchema.safeParse(artworkFields).success).toBe(true)
    expect(
      artworkRecordSchema.safeParse({
        ...artworkFields,
        ...recordMetadata,
        displayOrder: 0,
        publishedAt: null,
        status: 'DRAFT',
      }).success,
    ).toBe(true)
    expect(
      artworkRecordSchema.safeParse({
        ...artworkFields,
        ...recordMetadata,
        displayOrder: 0,
        publishedAt: new Date('2026-08-10T10:00:00.000Z'),
        status: 'PUBLISHED',
      }).success,
    ).toBe(false)
    const publicResult = artworkPublicSchema.safeParse({
      ...artworkFields,
      publishedAt: new Date('2026-08-10T10:00:00.000Z'),
    })

    expect(publicResult.success).toBe(false)

    if (publicResult.success) {
      throw new Error('Expected HERO-less public artwork to be rejected')
    }

    expect(publicResult.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({path: ['mediaPlacements']}),
      ]),
    )
  })
})
