import {z} from 'zod'

import {uuidSchema} from '@/server/content/domain'
import {artworkEditSchema} from '@/server/editorial-content'

import {inquiryLabelSchema, inquiryStatusSchema} from './inquiry-validation'

import type {ArtworkInquirySnapshot, InquiryRecord} from './inquiry-contracts'
import type {
  InquiryAuditEvent,
  InquiryInternalNote,
  InquiryManagementRepository,
  InquiryNotificationJob,
  InquiryTransaction,
} from './inquiry-repository'

type InquiryDatabaseTransaction = Readonly<{
  artwork: Readonly<{findFirst: (args: unknown) => Promise<unknown | null>}>
  auditEvent: Readonly<{create: (args: unknown) => Promise<unknown>}>
  contentRevision: Readonly<{
    findFirst: (args: unknown) => Promise<unknown | null>
  }>
  inquiry: Readonly<{
    create: (args: unknown) => Promise<unknown>
    update: (args: unknown) => Promise<unknown>
  }>
  inquiryInternalNote: Readonly<{
    create: (args: unknown) => Promise<unknown>
  }>
  outboxJob: Readonly<{create: (args: unknown) => Promise<unknown>}>
}>

export type InquiryDatabase = Readonly<{
  $transaction: <Result>(
    callback: (transaction: InquiryDatabaseTransaction) => Promise<Result>,
  ) => Promise<Result>
}>

const localeSchema = z.enum(['en', 'tr', 'ru', 'ky'])
const artworkSnapshotSchema = z
  .object({
    id: uuidSchema,
    locale: localeSchema,
    slug: z.string().min(1).max(160),
    title: z.string().min(1).max(200),
    year: z.number().int().min(1000).max(3000).nullable(),
  })
  .strict()
const recordBaseShape = {
  abuseKeyHash: z.string().regex(/^[a-f0-9]{64}$/u),
  consentedAt: z.date(),
  createdAt: z.date(),
  email: z.email().max(320),
  erasePersonalDataAfter: z.date(),
  id: uuidSchema,
  labels: z.array(inquiryLabelSchema).max(30),
  locale: localeSchema,
  name: z.string().min(2).max(120),
  phone: z.string().max(40).nullable(),
  privacyNoticeVersion: z.string().min(1).max(40),
  source: z.literal('WEBSITE'),
  status: inquiryStatusSchema,
  submissionId: uuidSchema,
  updatedAt: z.date(),
} as const
const inquiryRecordSchema = z.discriminatedUnion('type', [
  z
    .object({
      ...recordBaseShape,
      message: z.string().max(4_000).nullable(),
      relatedArtworkSnapshot: artworkSnapshotSchema,
      type: z.literal('AVAILABILITY'),
    })
    .strict(),
  z
    .object({
      ...recordBaseShape,
      brief: z.string().min(20).max(4_000),
      message: z.string().max(4_000).nullable(),
      preferredTimeline: z.string().max(300).nullable(),
      relatedArtworkSnapshot: z.null(),
      type: z.literal('COMMISSION'),
    })
    .strict(),
  z
    .object({
      ...recordBaseShape,
      message: z.string().min(10).max(4_000),
      relatedArtworkSnapshot: z.null(),
      subject: z.string().min(2).max(200),
      type: z.literal('GENERAL'),
    })
    .strict(),
  z
    .object({
      ...recordBaseShape,
      message: z.string().min(10).max(4_000),
      relatedArtworkSnapshot: z.null(),
      subject: z.string().min(2).max(200),
      type: z.literal('COLLECTOR'),
    })
    .strict(),
  z
    .object({
      ...recordBaseShape,
      attendees: z.number().int().min(1).max(12).nullable(),
      message: z.string().max(4_000).nullable(),
      preferredDates: z
        .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/u))
        .min(1)
        .max(3),
      relatedArtworkSnapshot: artworkSnapshotSchema.nullable(),
      type: z.literal('PRIVATE_VIEWING'),
    })
    .strict(),
])
const revisionSchema = z.object({snapshot: z.unknown()}).passthrough()

function duplicateError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  )
}

function calendarDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function artworkColumns(snapshot: ArtworkInquirySnapshot | null) {
  return {
    relatedArtworkId: snapshot?.id ?? null,
    relatedArtworkLocale: snapshot?.locale ?? null,
    relatedArtworkSlug: snapshot?.slug ?? null,
    relatedArtworkTitle: snapshot?.title ?? null,
    relatedArtworkYear: snapshot?.year ?? null,
  }
}

function inquiryData(recordInput: InquiryRecord) {
  const record = inquiryRecordSchema.parse(recordInput)
  const shared = {
    abuseKeyHash: record.abuseKeyHash,
    consentedAt: record.consentedAt,
    createdAt: record.createdAt,
    email: record.email,
    id: record.id,
    labels: [...record.labels],
    locale: record.locale,
    name: record.name,
    phone: record.phone,
    privacyNoticeVersion: record.privacyNoticeVersion,
    purgeAfter: record.erasePersonalDataAfter,
    source: record.source,
    status: record.status,
    submissionId: record.submissionId,
    updatedAt: record.updatedAt,
  }

  switch (record.type) {
    case 'AVAILABILITY':
      return {
        ...shared,
        ...artworkColumns(record.relatedArtworkSnapshot),
        message: record.message,
        type: record.type,
      }
    case 'COMMISSION':
      return {
        ...shared,
        ...artworkColumns(null),
        brief: record.brief,
        message: record.message,
        preferredTimeline: record.preferredTimeline,
        type: record.type,
      }
    case 'COLLECTOR':
    case 'GENERAL':
      return {
        ...shared,
        ...artworkColumns(null),
        message: record.message,
        subject: record.subject,
        type: record.type,
      }
    case 'PRIVATE_VIEWING':
      return {
        ...shared,
        ...artworkColumns(record.relatedArtworkSnapshot),
        attendees: record.attendees,
        message: record.message,
        preferredDates: record.preferredDates.map(calendarDate),
        type: record.type,
      }
  }
}

export function createDatabaseInquiryPersistence(
  database: InquiryDatabase,
  dependencies: Readonly<{now?: () => Date}> = {},
) {
  const now = dependencies.now ?? (() => new Date())
  const transactions = new WeakMap<object, InquiryDatabaseTransaction>()

  function databaseTransaction(transaction: InquiryTransaction) {
    const selected = transactions.get(transaction)

    if (!selected) throw new Error('INQUIRY_TRANSACTION_INVALID')

    return selected
  }

  const unitOfWork = Object.freeze({
    execute<Result>(
      work: (transaction: InquiryTransaction) => Promise<Result>,
    ) {
      return database.$transaction(async transaction => {
        const scope = Object.freeze({scope: 'database-inquiry'})

        transactions.set(scope, transaction)

        try {
          return await work(scope)
        } finally {
          transactions.delete(scope)
        }
      })
    },
  })

  const repository = Object.freeze({
    async create(transaction: InquiryTransaction, inquiry: InquiryRecord) {
      try {
        await databaseTransaction(transaction).inquiry.create({
          data: inquiryData(inquiry),
        })

        return 'CREATED' as const
      } catch (error) {
        if (duplicateError(error)) return 'DUPLICATE' as const

        throw error
      }
    },
    async findRelatedArtworkSnapshot(
      transaction: InquiryTransaction,
      query: Readonly<{id: string; locale: 'en' | 'tr' | 'ru' | 'ky'}>,
    ) {
      const parsed = z
        .object({id: uuidSchema, locale: localeSchema})
        .strict()
        .parse(query)
      const current = databaseTransaction(transaction)
      const artwork = await current.artwork.findFirst({
        select: {id: true},
        where: {id: parsed.id, publishedAt: {lte: now()}, status: 'PUBLISHED'},
      })

      if (!artwork) return null

      const revision = revisionSchema.safeParse(
        await current.contentRevision.findFirst({
          orderBy: {version: 'desc'},
          where: {entityId: parsed.id, entityType: 'ARTWORK'},
        }),
      )

      if (!revision.success) return null

      const snapshot = artworkEditSchema.safeParse(revision.data.snapshot)

      if (!snapshot.success || snapshot.data.locale !== parsed.locale)
        return null

      return Object.freeze({
        id: parsed.id,
        locale: snapshot.data.locale,
        slug: snapshot.data.slug,
        title: snapshot.data.title,
        year: snapshot.data.year ?? null,
      })
    },
  })

  const outbox = Object.freeze({
    async enqueue(
      transaction: InquiryTransaction,
      job: InquiryNotificationJob,
    ) {
      await databaseTransaction(transaction).outboxJob.create({
        data: {
          idempotencyKey: job.deduplicationKey,
          payload: {...job.payload},
          type: job.type,
        },
      })
    },
  })

  const audit = Object.freeze({
    async record(transaction: InquiryTransaction, event: InquiryAuditEvent) {
      await databaseTransaction(transaction).auditEvent.create({
        data: {
          action: event.action,
          actorUserId: null,
          entityId: event.targetId,
          entityType: event.targetType,
          metadata: {...event.metadata},
        },
      })
    },
  })

  const management: InquiryManagementRepository = Object.freeze({
    async addInternalNote(
      transaction: InquiryTransaction,
      noteInput: InquiryInternalNote,
    ) {
      const note = z
        .object({
          authorId: uuidSchema,
          body: z.string().trim().min(1).max(10_000),
          createdAt: z.date(),
          id: uuidSchema,
          inquiryId: uuidSchema,
        })
        .strict()
        .parse(noteInput)

      await databaseTransaction(transaction).inquiryInternalNote.create({
        data: {
          authorUserId: note.authorId,
          body: note.body,
          createdAt: note.createdAt,
          id: note.id,
          inquiryId: note.inquiryId,
        },
      })
    },
    async replaceLabels(
      transaction: InquiryTransaction,
      input: Parameters<InquiryManagementRepository['replaceLabels']>[1],
    ) {
      const parsed = z
        .object({
          inquiryId: uuidSchema,
          labels: z.array(inquiryLabelSchema).max(30),
        })
        .strict()
        .parse(input)

      await databaseTransaction(transaction).inquiry.update({
        data: {labels: [...parsed.labels]},
        where: {id: parsed.inquiryId},
      })
    },
    async updateStatus(
      transaction: InquiryTransaction,
      input: Parameters<InquiryManagementRepository['updateStatus']>[1],
    ) {
      const parsed = z
        .object({
          inquiryId: uuidSchema,
          status: inquiryStatusSchema,
          updatedAt: z.date(),
        })
        .strict()
        .parse(input)

      await databaseTransaction(transaction).inquiry.update({
        data: {status: parsed.status, updatedAt: parsed.updatedAt},
        where: {id: parsed.inquiryId},
      })
    },
  })

  return Object.freeze({audit, management, outbox, repository, unitOfWork})
}
