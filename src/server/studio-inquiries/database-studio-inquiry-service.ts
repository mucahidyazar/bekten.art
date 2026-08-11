import {z} from 'zod'

import {uuidSchema} from '@/server/editorial-content'
import {
  inquiryLabelSchema,
  inquiryStatusSchema,
} from '@/server/inquiries/inquiry-validation'

type InquiryReadDelegate = Readonly<{
  findMany: (args: unknown) => Promise<readonly unknown[]>
  findUnique: (args: unknown) => Promise<unknown | null>
}>

type InquiryTransaction = Readonly<{
  auditEvent: Readonly<{create: (args: unknown) => Promise<unknown>}>
  inquiry: Readonly<{update: (args: unknown) => Promise<unknown>}>
  inquiryInternalNote: Readonly<{create: (args: unknown) => Promise<unknown>}>
}>

export type StudioInquiryDatabase = Readonly<{
  $transaction: <Result>(
    callback: (transaction: InquiryTransaction) => Promise<Result>,
  ) => Promise<Result>
  inquiry: InquiryReadDelegate
}>

const localeSchema = z.enum(['en', 'tr', 'ru', 'ky'])
const inquiryTypeSchema = z.enum([
  'AVAILABILITY',
  'COLLECTOR',
  'COMMISSION',
  'GENERAL',
  'PRIVATE_VIEWING',
])
const listQuerySchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(50),
    locale: localeSchema.optional(),
    status: inquiryStatusSchema.optional(),
    type: inquiryTypeSchema.optional(),
  })
  .strict()
const updateSchema = z
  .object({
    actorUserId: uuidSchema,
    inquiryId: uuidSchema,
    labels: z.array(inquiryLabelSchema).max(30),
    note: z.string().trim().max(10_000),
    requestId: z.string().trim().min(1).max(160),
    status: inquiryStatusSchema,
  })
  .strict()

export function createDatabaseStudioInquiryService(
  database: StudioInquiryDatabase,
  dependencies: Readonly<{
    generateId?: () => string
    now?: () => Date
  }> = {},
) {
  const generateId = dependencies.generateId ?? (() => crypto.randomUUID())
  const now = dependencies.now ?? (() => new Date())

  return Object.freeze({
    findById(idInput: string) {
      const id = uuidSchema.parse(idInput)

      return database.inquiry.findUnique({
        include: {
          internalNotes: {
            include: {authorUser: {select: {email: true, name: true}}},
            orderBy: {createdAt: 'desc'},
            take: 100,
          },
        },
        where: {id},
      })
    },
    list(queryInput: unknown) {
      const query = listQuerySchema.parse(queryInput)

      return database.inquiry.findMany({
        orderBy: [{createdAt: 'desc'}, {id: 'desc'}],
        select: {
          createdAt: true,
          email: true,
          id: true,
          labels: true,
          locale: true,
          name: true,
          relatedArtworkTitle: true,
          status: true,
          subject: true,
          type: true,
          updatedAt: true,
        },
        take: query.limit,
        where: {
          ...(query.locale ? {locale: query.locale} : {}),
          ...(query.status ? {status: query.status} : {}),
          ...(query.type ? {type: query.type} : {}),
        },
      })
    },
    async update(inputValue: unknown) {
      const input = updateSchema.parse(inputValue)
      const updatedAt = now()

      return database.$transaction(async transaction => {
        await transaction.inquiry.update({
          data: {
            labels: [...input.labels],
            status: input.status,
            updatedAt,
          },
          where: {id: input.inquiryId},
        })

        if (input.note.length > 0) {
          await transaction.inquiryInternalNote.create({
            data: {
              authorUserId: input.actorUserId,
              body: input.note,
              createdAt: updatedAt,
              id: uuidSchema.parse(generateId()),
              inquiryId: input.inquiryId,
            },
          })
        }

        await transaction.auditEvent.create({
          data: {
            action: 'inquiry.studio-updated',
            actorUserId: input.actorUserId,
            entityId: input.inquiryId,
            entityType: 'Inquiry',
            metadata: {
              labelCount: input.labels.length,
              noteAdded: input.note.length > 0,
              status: input.status,
            },
            requestId: input.requestId,
          },
        })
      })
    },
  })
}
