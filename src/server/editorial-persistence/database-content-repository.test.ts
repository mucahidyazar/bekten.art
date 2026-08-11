import {describe, expect, it, vi} from 'vitest'

import {EditorialVersionConflictError} from '@/server/editorial-publishing'
import {EditorialContentNotFoundError} from '@/server/editorial-publishing'

import {createDatabaseEditorialContentRepository} from './database-content-repository'
import {editorialEntityCodecs} from './editorial-entity-codecs'

const entityId = '9973ebcd-581d-427f-a23a-9e77fb008f52'
const actorUserId = '084df664-a286-4cfa-bc4c-5021aaeaeb31'
const mediaObjectId = 'c33944f3-b5d8-49ed-a5cb-2e701a91be3c'
const now = new Date('2026-08-11T12:00:00.000Z')
const publishedAt = new Date('2026-08-10T12:00:00.000Z')
const edit = {
  availability: 'ON_REQUEST' as const,
  collectionId: null,
  description:
    'A sufficiently complete description of the artwork and its material history.',
  dimensions: '120 × 90 cm',
  displayOrder: 0,
  locale: 'en' as const,
  mediaPlacements: [
    {
      altText: 'A layered abstract composition in ochre and charcoal',
      caption: null,
      credit: 'Bekten Studio archive',
      crop: 'ORIGINAL' as const,
      displayOrder: 0,
      focalPoint: {x: 0.4, y: 0.6},
      mediaObjectId,
      role: 'HERO' as const,
    },
  ],
  medium: 'Oil and mineral pigment on canvas',
  seo: {
    canonicalPath: '/en/works/silent-steppe',
    description:
      'An archival artwork presented through the Bekten Studio editorial collection.',
    noIndex: false,
    title: 'Silent Steppe — Bekten Studio',
  },
  slug: 'silent-steppe',
  title: 'Unpublished title',
  year: 2026,
}
const row = {
  availability: edit.availability,
  collectionId: null,
  createdAt: new Date('2026-08-01T10:00:00.000Z'),
  description: edit.description,
  dimensions: edit.dimensions,
  displayOrder: 0,
  id: entityId,
  locale: 'en',
  medium: edit.medium,
  publishedAt,
  seoCanonicalPath: edit.seo.canonicalPath,
  seoDescription: edit.seo.description,
  seoNoIndex: false,
  seoTitle: edit.seo.title,
  slug: edit.slug,
  status: 'PUBLISHED',
  title: edit.title,
  updatedAt: new Date('2026-08-11T10:00:00.000Z'),
  version: 3,
  year: edit.year,
}
const placement = {
  ...edit.mediaPlacements[0],
  createdAt: new Date('2026-08-01T10:00:00.000Z'),
  entityId,
  entityType: 'ARTWORK',
  id: 'f60a4720-9bc7-46b1-a65d-bd194be2fac0',
  updatedAt: new Date('2026-08-01T10:00:00.000Z'),
}
const publicSnapshot = {
  ...edit,
  title: 'Published title',
}

function fixture() {
  const transaction = {
    artwork: {
      create: vi.fn().mockResolvedValue({...row, publishedAt: null, status: 'DRAFT'}),
      findFirst: vi.fn().mockResolvedValue(row),
      findMany: vi.fn().mockResolvedValue([row]),
      findUnique: vi.fn().mockResolvedValue(row),
      updateMany: vi.fn().mockResolvedValue({count: 1}),
    },
    auditEvent: {create: vi.fn().mockResolvedValue({id: 'audit-1'})},
    contentMediaPlacement: {
      createMany: vi.fn().mockResolvedValue({count: 1}),
      deleteMany: vi.fn().mockResolvedValue({count: 1}),
      findMany: vi.fn().mockResolvedValue([placement]),
    },
    contentRevision: {
      findFirst: vi.fn().mockResolvedValue({snapshot: publicSnapshot}),
    },
  }
  const database = {
    $transaction: vi.fn(async callback => callback(transaction)),
  }
  const repository = createDatabaseEditorialContentRepository(
    database,
    editorialEntityCodecs,
    {now: () => now},
  )

  return {database, repository, transaction}
}

const context = {actorUserId, requestId: 'request-123'}

describe('database editorial content repository', () => {
  it('creates a validated draft, media placements and audit atomically', async () => {
    const configured = fixture()

    const created = await configured.repository.artworks.create(edit, context)

    expect(configured.database.$transaction).toHaveBeenCalledOnce()
    expect(configured.transaction.artwork.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        seoTitle: edit.seo.title,
        slug: 'silent-steppe',
        status: 'DRAFT',
        title: 'Unpublished title',
        version: 1,
      }),
    })
    expect(
      configured.transaction.contentMediaPlacement.createMany,
    ).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          entityId,
          entityType: 'ARTWORK',
          mediaObjectId,
          role: 'HERO',
        }),
      ],
    })
    expect(configured.transaction.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'editorial.created',
        actorUserId,
        entityId,
        requestId: 'request-123',
      }),
    })
    expect(created.title).toBe('Unpublished title')
  })

  it('updates through optimistic CAS and replaces media inside one transaction', async () => {
    const configured = fixture()

    await configured.repository.artworks.update(
      entityId,
      {expectedVersion: 3, value: {...edit, title: 'Revised title'}},
      context,
    )

    expect(configured.transaction.artwork.updateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({title: 'Revised title', version: 4}),
      where: {id: entityId, version: 3},
    })
    expect(
      configured.transaction.contentMediaPlacement.deleteMany,
    ).toHaveBeenCalledWith({where: {entityId, entityType: 'ARTWORK'}})
  })

  it('throws a version conflict and leaves media untouched when CAS loses', async () => {
    const configured = fixture()

    configured.transaction.artwork.updateMany.mockResolvedValueOnce({count: 0})

    await expect(
      configured.repository.artworks.update(
        entityId,
        {expectedVersion: 2, value: edit},
        context,
      ),
    ).rejects.toBeInstanceOf(EditorialVersionConflictError)
    expect(
      configured.transaction.contentMediaPlacement.deleteMany,
    ).not.toHaveBeenCalled()
  })

  it('serves public content from the immutable revision without leaking a newer draft', async () => {
    const configured = fixture()

    const published = await configured.repository.artworks.findPublishedBySlug({
      locale: 'en',
      slug: 'silent-steppe',
    })

    expect(configured.transaction.artwork.findFirst).toHaveBeenCalledWith({
      where: {
        locale: 'en',
        publishedAt: {lte: now},
        slug: 'silent-steppe',
        status: 'PUBLISHED',
      },
    })
    expect(published?.title).toBe('Published title')
    expect(published?.title).not.toBe(row.title)
  })

  it('bounds Studio lists and loads placements in one batched query', async () => {
    const configured = fixture()

    const records = await configured.repository.artworks.list({
      cursor: entityId,
      limit: 10,
      locale: 'en',
      status: 'DRAFT',
    })

    expect(configured.transaction.artwork.findMany).toHaveBeenCalledWith({
      cursor: {id: entityId},
      orderBy: [{displayOrder: 'asc'}, {id: 'asc'}],
      skip: 1,
      take: 10,
      where: {locale: 'en', status: 'DRAFT'},
    })
    expect(
      configured.transaction.contentMediaPlacement.findMany,
    ).toHaveBeenCalledWith({
      orderBy: {displayOrder: 'asc'},
      where: {entityId: {in: [entityId]}, entityType: 'ARTWORK'},
    })
    expect(records).toHaveLength(1)
  })

  it('archives and reorders only expected versions with audit evidence', async () => {
    const configured = fixture()

    await configured.repository.artworks.archive(entityId, 3, context)
    await configured.repository.artworks.reorder(
      [{displayOrder: 9, expectedVersion: 3, id: entityId}],
      context,
    )

    expect(configured.transaction.artwork.updateMany).toHaveBeenNthCalledWith(1, {
      data: {publishedAt: null, status: 'ARCHIVED', version: 4},
      where: {id: entityId, version: 3},
    })
    expect(configured.transaction.artwork.updateMany).toHaveBeenNthCalledWith(2, {
      data: {displayOrder: 9, version: 4},
      where: {id: entityId, version: 3},
    })
    expect(configured.transaction.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({action: 'editorial.archived'}),
    })
    expect(configured.transaction.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({action: 'editorial.reordered'}),
    })
  })

  it('returns bounded null and empty results without issuing placement fan-out', async () => {
    const configured = fixture()

    configured.transaction.artwork.findUnique.mockResolvedValueOnce(null)
    await expect(
      configured.repository.artworks.findById(entityId),
    ).resolves.toBeNull()

    configured.transaction.artwork.findFirst.mockResolvedValueOnce(null)
    await expect(
      configured.repository.artworks.findPublishedBySlug({
        before: now,
        locale: 'en',
        slug: 'silent-steppe',
      }),
    ).resolves.toBeNull()

    configured.transaction.artwork.findMany.mockResolvedValueOnce([])
    await expect(
      configured.repository.artworks.list({locale: 'en'}),
    ).resolves.toEqual([])
    expect(configured.transaction.artwork.findMany).toHaveBeenLastCalledWith({
      orderBy: [{displayOrder: 'asc'}, {id: 'asc'}],
      take: 24,
      where: {locale: 'en'},
    })
  })

  it('fails public reads closed when lifecycle or revision evidence is missing', async () => {
    const configured = fixture()

    configured.transaction.contentRevision.findFirst.mockResolvedValueOnce(null)
    await expect(
      configured.repository.artworks.findPublishedBySlug({
        locale: 'en',
        slug: 'silent-steppe',
      }),
    ).resolves.toBeNull()

    configured.transaction.artwork.findFirst.mockResolvedValueOnce({
      ...row,
      publishedAt: null,
    })
    await expect(
      configured.repository.artworks.findPublishedBySlug({
        locale: 'en',
        slug: 'silent-steppe',
      }),
    ).rejects.toThrow('EDITORIAL_PERSISTENCE_ROW_INVALID')
  })

  it('distinguishes a deleted entity from a concurrent version update', async () => {
    const configured = fixture()

    configured.transaction.artwork.updateMany.mockResolvedValueOnce({count: 0})
    configured.transaction.artwork.findUnique.mockResolvedValueOnce(null)

    await expect(
      configured.repository.artworks.archive(entityId, 3, context),
    ).rejects.toBeInstanceOf(EditorialContentNotFoundError)

    configured.transaction.artwork.updateMany.mockResolvedValueOnce({count: 0})
    await expect(
      configured.repository.artworks.reorder(
        [{displayOrder: 1, expectedVersion: 2, id: entityId}],
        context,
      ),
    ).rejects.toBeInstanceOf(EditorialVersionConflictError)
  })

  it('rejects ambiguous reorder batches before opening a transaction', () => {
    const configured = fixture()

    expect(() => configured.repository.artworks.reorder([], context)).toThrow()
    expect(() =>
      configured.repository.artworks.reorder(
        [
          {displayOrder: 1, expectedVersion: 3, id: entityId},
          {displayOrder: 2, expectedVersion: 3, id: entityId},
        ],
        context,
      ),
    ).toThrow()
    expect(() =>
      configured.repository.artworks.reorder(
        [
          {displayOrder: 1, expectedVersion: 3, id: entityId},
          {
            displayOrder: 1,
            expectedVersion: 3,
            id: '827a061c-dbf6-4ae6-afcb-9f3666a5ff69',
          },
        ],
        context,
      ),
    ).toThrow()
  })

  it('creates media-free drafts without an empty createMany operation', async () => {
    const configured = fixture()
    const mediaFree = {...edit, mediaPlacements: []}

    configured.transaction.contentMediaPlacement.findMany.mockResolvedValueOnce(
      [],
    )

    await expect(
      configured.repository.artworks.create(mediaFree, context),
    ).resolves.toMatchObject({mediaPlacements: [], status: 'DRAFT'})
    expect(
      configured.transaction.contentMediaPlacement.createMany,
    ).not.toHaveBeenCalled()
  })
})
