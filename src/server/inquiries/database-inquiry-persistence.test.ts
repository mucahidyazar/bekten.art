import {describe, expect, it, vi} from 'vitest'

import {createDatabaseInquiryPersistence} from './database-inquiry-persistence'

import type {InquiryRecord} from './inquiry-contracts'

const inquiryId = '123e4567-e89b-42d3-a456-426614174010'
const submissionId = '123e4567-e89b-42d3-a456-426614174000'
const artworkId = '123e4567-e89b-42d3-a456-426614174001'
const authorId = '084df664-a286-4cfa-bc4c-5021aaeaeb31'
const now = new Date('2026-08-11T09:30:00.000Z')
const baseRecord = {
  abuseKeyHash: 'a'.repeat(64),
  consentedAt: now,
  createdAt: now,
  email: 'collector@example.com',
  erasePersonalDataAfter: new Date('2028-08-10T09:30:00.000Z'),
  id: inquiryId,
  labels: [],
  locale: 'en' as const,
  name: 'Ada Collector',
  phone: null,
  privacyNoticeVersion: '2026-08-11',
  source: 'WEBSITE' as const,
  status: 'NEW' as const,
  submissionId,
  updatedAt: now,
}
const availabilityRecord: InquiryRecord = {
  ...baseRecord,
  message: 'Please share the viewing options for this work.',
  relatedArtworkSnapshot: {
    id: artworkId,
    locale: 'en',
    slug: 'published-slug',
    title: 'Published title',
    year: 2025,
  },
  type: 'AVAILABILITY',
}

function fixture() {
  const transaction = {
    artwork: {
      findFirst: vi.fn().mockResolvedValue({id: artworkId}),
    },
    auditEvent: {create: vi.fn().mockResolvedValue({id: 'audit-1'})},
    contentRevision: {
      findFirst: vi.fn().mockResolvedValue({
        snapshot: {
          availability: 'ON_REQUEST',
          collectionId: null,
          description:
            'A sufficiently complete description of the artwork and its material history.',
          dimensions: null,
          displayOrder: 0,
          locale: 'en',
          mediaPlacements: [],
          medium: null,
          seo: {
            canonicalPath: '/en/works/published-slug',
            description:
              'An archival artwork presented through the Bekten Studio editorial collection.',
            noIndex: false,
            title: 'Published title — Bekten Studio',
          },
          slug: 'published-slug',
          title: 'Published title',
          year: 2025,
        },
      }),
    },
    inquiry: {
      create: vi.fn().mockResolvedValue({id: inquiryId}),
      update: vi.fn().mockResolvedValue({id: inquiryId}),
    },
    inquiryInternalNote: {
      create: vi.fn().mockResolvedValue({id: 'note-1'}),
    },
    outboxJob: {create: vi.fn().mockResolvedValue({id: 'job-1'})},
  }
  const database = {
    $transaction: vi.fn(async callback => callback(transaction)),
  }
  const persistence = createDatabaseInquiryPersistence(database, {
    now: () => now,
  })

  return {database, persistence, transaction}
}

describe('database inquiry persistence', () => {
  it('stores typed inquiry fields and immutable artwork snapshot columns', async () => {
    const configured = fixture()

    await configured.persistence.unitOfWork.execute(async transaction => {
      await expect(
        configured.persistence.repository.create(
          transaction,
          availabilityRecord,
        ),
      ).resolves.toBe('CREATED')
    })

    expect(configured.transaction.inquiry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: inquiryId,
        purgeAfter: baseRecord.erasePersonalDataAfter,
        relatedArtworkId: artworkId,
        relatedArtworkLocale: 'en',
        relatedArtworkSlug: 'published-slug',
        relatedArtworkTitle: 'Published title',
        relatedArtworkYear: 2025,
        submissionId,
        type: 'AVAILABILITY',
      }),
    })
  })

  it('turns a unique create race into the same idempotent duplicate result', async () => {
    const configured = fixture()

    configured.transaction.inquiry.create.mockRejectedValueOnce({code: 'P2002'})

    await configured.persistence.unitOfWork.execute(async transaction => {
      await expect(
        configured.persistence.repository.create(
          transaction,
          availabilityRecord,
        ),
      ).resolves.toBe('DUPLICATE')
    })
  })

  it('reads related artwork identity from the latest published revision, not a draft row', async () => {
    const configured = fixture()

    const result = await configured.persistence.unitOfWork.execute(transaction =>
      configured.persistence.repository.findRelatedArtworkSnapshot(transaction, {
        id: artworkId,
        locale: 'en',
      }),
    )

    expect(configured.transaction.artwork.findFirst).toHaveBeenCalledWith({
      select: {id: true},
      where: {id: artworkId, publishedAt: {lte: now}, status: 'PUBLISHED'},
    })
    expect(configured.transaction.contentRevision.findFirst).toHaveBeenCalledWith({
      orderBy: {version: 'desc'},
      where: {entityId: artworkId, entityType: 'ARTWORK'},
    })
    expect(result).toEqual({
      id: artworkId,
      locale: 'en',
      slug: 'published-slug',
      title: 'Published title',
      year: 2025,
    })
  })

  it('writes notification and audit records on the same transaction scope', async () => {
    const configured = fixture()

    await configured.persistence.unitOfWork.execute(async transaction => {
      await configured.persistence.outbox.enqueue(transaction, {
        deduplicationKey: `inquiry.created:${inquiryId}`,
        payload: {inquiryId, locale: 'en', type: 'AVAILABILITY'},
        type: 'inquiry.created',
      })
      await configured.persistence.audit.record(transaction, {
        action: 'inquiry.created',
        metadata: {locale: 'en', type: 'AVAILABILITY'},
        targetId: inquiryId,
        targetType: 'inquiry',
      })
    })

    expect(configured.transaction.outboxJob.create).toHaveBeenCalledWith({
      data: {
        idempotencyKey: `inquiry.created:${inquiryId}`,
        payload: {inquiryId, locale: 'en', type: 'AVAILABILITY'},
        type: 'inquiry.created',
      },
    })
    expect(configured.transaction.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'inquiry.created',
        entityId: inquiryId,
        entityType: 'inquiry',
      }),
    })
  })

  it('updates status, labels and append-only notes through management methods', async () => {
    const configured = fixture()

    await configured.persistence.unitOfWork.execute(async transaction => {
      await configured.persistence.management.updateStatus(transaction, {
        inquiryId,
        status: 'IN_REVIEW',
        updatedAt: now,
      })
      await configured.persistence.management.replaceLabels(transaction, {
        inquiryId,
        labels: ['priority', 'private-viewing'],
      })
      await configured.persistence.management.addInternalNote(transaction, {
        authorId,
        body: 'Collector requested a private afternoon appointment.',
        createdAt: now,
        id: 'f60a4720-9bc7-46b1-a65d-bd194be2fac0',
        inquiryId,
      })
    })

    expect(configured.transaction.inquiry.update).toHaveBeenNthCalledWith(1, {
      data: {status: 'IN_REVIEW', updatedAt: now},
      where: {id: inquiryId},
    })
    expect(configured.transaction.inquiry.update).toHaveBeenNthCalledWith(2, {
      data: {labels: ['priority', 'private-viewing']},
      where: {id: inquiryId},
    })
    expect(configured.transaction.inquiryInternalNote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({authorUserId: authorId, inquiryId}),
    })
  })

  it('rejects transaction tokens created by a different persistence boundary', async () => {
    const first = fixture()
    const second = fixture()

    await expect(
      first.persistence.unitOfWork.execute(transaction =>
        second.persistence.repository.create(transaction, availabilityRecord),
      ),
    ).rejects.toThrow('INQUIRY_TRANSACTION_INVALID')
  })
})
