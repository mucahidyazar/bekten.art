import {z} from 'zod'

import {uuidSchema} from '@/server/content/domain'

import {
  inquirySubmissionContextSchema,
  publicInquiryInputSchema,
} from './inquiry-validation'

import type {
  ArtworkInquirySnapshot,
  InquiryRecord,
  InquiryRecordBase,
} from './inquiry-contracts'
import type {
  InquiryAuditWriter,
  InquiryOutboxWriter,
  InquirySubmissionRepository,
  InquiryUnitOfWork,
} from './inquiry-repository'
import type {
  InquirySubmissionContext,
  PublicInquiryInput,
} from './inquiry-validation'

const serviceConfigurationSchema = z.object({
  privacyNoticeVersion: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/u),
  retentionDays: z.number().int().min(1).max(3_650),
})

type InquiryAbuseGuard = Readonly<{
  check: (
    input: Readonly<{
      abuseKeyHash: string
      at: Date
      submissionId: string
    }>,
  ) => Promise<Readonly<{allowed: boolean}>>
}>

type InquiryServiceDependencies = Readonly<{
  abuseGuard: InquiryAbuseGuard
  audit: InquiryAuditWriter
  clock: Readonly<{now: () => Date}>
  idGenerator: Readonly<{generate: () => string}>
  outbox: InquiryOutboxWriter
  privacyNoticeVersion: string
  repository: InquirySubmissionRepository
  retentionDays: number
  unitOfWork: InquiryUnitOfWork
}>

type RecordMetadata = Readonly<{
  artworkSnapshot: ArtworkInquirySnapshot | null
  context: InquirySubmissionContext
  id: string
  now: Date
  privacyNoticeVersion: string
  retentionDays: number
}>

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1_000)
}

function baseRecord(
  input: PublicInquiryInput,
  metadata: RecordMetadata,
): InquiryRecordBase {
  return Object.freeze({
    abuseKeyHash: metadata.context.abuseKeyHash,
    consentedAt: new Date(metadata.now),
    createdAt: new Date(metadata.now),
    email: input.email,
    erasePersonalDataAfter: addDays(metadata.now, metadata.retentionDays),
    id: metadata.id,
    labels: Object.freeze([]),
    locale: input.locale,
    name: input.name,
    phone: input.phone ?? null,
    privacyNoticeVersion: metadata.privacyNoticeVersion,
    source: metadata.context.source,
    status: 'NEW',
    submissionId: input.submissionId,
    updatedAt: new Date(metadata.now),
  })
}

function copyArtworkSnapshot(snapshot: ArtworkInquirySnapshot | null) {
  if (!snapshot) return null

  return Object.freeze({...snapshot})
}

function inquiryRecord(
  input: PublicInquiryInput,
  metadata: RecordMetadata,
): InquiryRecord {
  const common = baseRecord(input, metadata)
  const relatedArtworkSnapshot = copyArtworkSnapshot(metadata.artworkSnapshot)

  switch (input.type) {
    case 'AVAILABILITY':
      return Object.freeze({
        ...common,
        message: input.message ?? null,
        relatedArtworkSnapshot:
          relatedArtworkSnapshot as ArtworkInquirySnapshot,
        type: input.type,
      })
    case 'COMMISSION':
      return Object.freeze({
        ...common,
        brief: input.brief,
        message: input.message ?? null,
        preferredTimeline: input.preferredTimeline ?? null,
        relatedArtworkSnapshot: null,
        type: input.type,
      })
    case 'GENERAL':
      return Object.freeze({
        ...common,
        message: input.message,
        relatedArtworkSnapshot: null,
        subject: input.subject,
        type: input.type,
      })
    case 'PRIVATE_VIEWING':
      return Object.freeze({
        ...common,
        attendees: input.attendees ?? null,
        message: input.message ?? null,
        preferredDates: Object.freeze([...input.preferredDates]),
        relatedArtworkSnapshot,
        type: input.type,
      })
  }
}

async function relatedArtworkSnapshot(
  dependencies: InquiryServiceDependencies,
  transaction: Parameters<
    InquirySubmissionRepository['findRelatedArtworkSnapshot']
  >[0],
  input: PublicInquiryInput,
) {
  if (input.type === 'AVAILABILITY' || input.type === 'PRIVATE_VIEWING') {
    if (!input.relatedArtworkId) return null

    return dependencies.repository.findRelatedArtworkSnapshot(transaction, {
      id: input.relatedArtworkId,
      locale: input.locale,
    })
  }

  return null
}

export class InquirySubmissionError extends Error {
  constructor() {
    super('INQUIRY_SUBMISSION_FAILED')
    this.name = 'InquirySubmissionError'
  }
}

export function createInquiryService(dependencies: InquiryServiceDependencies) {
  const configuration = serviceConfigurationSchema.parse(dependencies)

  return Object.freeze({
    async submit(inputValue: unknown, contextValue: unknown) {
      const parsedInput = publicInquiryInputSchema.safeParse(inputValue)

      if (!parsedInput.success) {
        throw new Error('INQUIRY_INPUT_INVALID')
      }

      const parsedContext =
        inquirySubmissionContextSchema.safeParse(contextValue)

      if (!parsedContext.success) {
        throw new Error('INQUIRY_CONTEXT_INVALID')
      }

      const now = new Date(dependencies.clock.now())

      try {
        const abuseDecision = await dependencies.abuseGuard.check({
          abuseKeyHash: parsedContext.data.abuseKeyHash,
          at: now,
          submissionId: parsedInput.data.submissionId,
        })

        if (!abuseDecision.allowed) return {accepted: true} as const

        await dependencies.unitOfWork.execute(async transaction => {
          const artworkSnapshot = await relatedArtworkSnapshot(
            dependencies,
            transaction,
            parsedInput.data,
          )
          const expectsArtwork =
            parsedInput.data.type === 'AVAILABILITY' ||
            (parsedInput.data.type === 'PRIVATE_VIEWING' &&
              Boolean(parsedInput.data.relatedArtworkId))

          if (expectsArtwork && !artworkSnapshot) return

          const id = uuidSchema.parse(dependencies.idGenerator.generate())
          const record = inquiryRecord(parsedInput.data, {
            artworkSnapshot,
            context: parsedContext.data,
            id,
            now,
            privacyNoticeVersion: configuration.privacyNoticeVersion,
            retentionDays: configuration.retentionDays,
          })
          const createResult = await dependencies.repository.create(
            transaction,
            record,
          )

          if (createResult === 'DUPLICATE') return

          await dependencies.outbox.enqueue(transaction, {
            deduplicationKey: `inquiry.created:${id}`,
            payload: {
              inquiryId: id,
              locale: record.locale,
              type: record.type,
            },
            type: 'inquiry.created',
          })
          await dependencies.audit.record(transaction, {
            action: 'inquiry.created',
            metadata: {locale: record.locale, type: record.type},
            targetId: id,
            targetType: 'inquiry',
          })
        })

        return {accepted: true} as const
      } catch {
        throw new InquirySubmissionError()
      }
    },
  })
}
