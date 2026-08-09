import {describe, expect, it, vi} from 'vitest'

import {createDatabaseContentRepository} from './database-content-repository'

const now = new Date('2026-08-09T12:00:00.000Z')

function artworkRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '8bb4ae40-f789-4de4-96e7-f819a36b8420',
    locale: 'en',
    slug: 'silent-steppe',
    title: 'Silent Steppe',
    description: 'An original oil painting inspired by the Kyrgyz steppe.',
    imageUrl: '/media/silent-steppe.webp',
    imageAlt: 'Warm abstract landscape of the Kyrgyz steppe',
    objectKey: null,
    medium: 'Oil on canvas',
    dimensions: '100 × 120 cm',
    year: 2025,
    priceMinor: null,
    currency: null,
    isAvailable: true,
    displayOrder: 0,
    status: 'PUBLISHED',
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function configuredDatabase() {
  return {
    artwork: {
      create: vi.fn().mockResolvedValue(artworkRow()),
      findFirst: vi.fn().mockResolvedValue(artworkRow()),
      findMany: vi.fn().mockResolvedValue([artworkRow()]),
      findUnique: vi.fn().mockResolvedValue(artworkRow()),
      update: vi.fn().mockResolvedValue(artworkRow()),
    },
  }
}

describe('createDatabaseContentRepository', () => {
  it('validates input before persisting an artwork', async () => {
    const database = configuredDatabase()
    const repository = createDatabaseContentRepository(database)

    await expect(
      repository.artworks.create({
        locale: 'en',
        slug: 'silent-steppe',
        title: 'Silent Steppe',
        description: 'An original oil painting inspired by the Kyrgyz steppe.',
        imageUrl: '/media/silent-steppe.webp',
        imageAlt: 'Warm abstract landscape of the Kyrgyz steppe',
        medium: 'Oil on canvas',
        dimensions: '100 × 120 cm',
        year: 2025,
        isAvailable: true,
        displayOrder: 0,
        status: 'PUBLISHED',
        publishedAt: now,
      }),
    ).resolves.toMatchObject({slug: 'silent-steppe', status: 'PUBLISHED'})

    expect(database.artwork.create).toHaveBeenCalledWith({
      data: expect.objectContaining({slug: 'silent-steppe'}),
    })
  })

  it('rejects invalid input without calling the database', async () => {
    const database = configuredDatabase()
    const repository = createDatabaseContentRepository(database)

    await expect(
      repository.artworks.create({
        locale: 'en',
        slug: '../unsafe',
        title: '',
        description: 'Too short',
        imageUrl: 'javascript:alert(1)',
        imageAlt: '',
        isAvailable: true,
        displayOrder: -1,
        status: 'PUBLISHED',
      }),
    ).rejects.toThrow()

    expect(database.artwork.create).not.toHaveBeenCalled()
  })

  it('applies the public visibility invariant when listing artworks', async () => {
    const database = configuredDatabase()
    const repository = createDatabaseContentRepository(database)

    await repository.artworks.listPublished({locale: 'en', limit: 12})

    expect(database.artwork.findMany).toHaveBeenCalledWith({
      orderBy: [{displayOrder: 'asc'}, {publishedAt: 'desc'}],
      take: 12,
      where: {
        locale: 'en',
        publishedAt: {lte: expect.any(Date)},
        status: 'PUBLISHED',
      },
    })
  })

  it('uses a targeted locale-scoped published identifier query', async () => {
    const database = configuredDatabase()
    const repository = createDatabaseContentRepository(database)

    await repository.artworks.findPublishedByIdentifier({
      identifier: 'silent-steppe',
      locale: 'en',
    })

    expect(database.artwork.findFirst).toHaveBeenCalledWith({
      where: {
        locale: 'en',
        OR: [{slug: 'silent-steppe'}],
        publishedAt: {lte: expect.any(Date)},
        status: 'PUBLISHED',
      },
    })
  })

  it('fails closed when a database row does not match the domain contract', async () => {
    const database = configuredDatabase()

    database.artwork.findMany.mockResolvedValue([
      artworkRow({imageAlt: null, status: 'UNKNOWN'}),
    ])
    const repository = createDatabaseContentRepository(database)

    await expect(
      repository.artworks.listPublished({locale: 'en'}),
    ).rejects.toThrow()
  })

  it('archives instead of deleting content', async () => {
    const database = configuredDatabase()

    database.artwork.update.mockResolvedValue(
      artworkRow({status: 'ARCHIVED', publishedAt: null}),
    )
    const repository = createDatabaseContentRepository(database)

    await repository.artworks.archive('8bb4ae40-f789-4de4-96e7-f819a36b8420')

    expect(database.artwork.update).toHaveBeenCalledWith({
      data: {publishedAt: null, status: 'ARCHIVED'},
      where: {id: '8bb4ae40-f789-4de4-96e7-f819a36b8420'},
    })
  })
})
