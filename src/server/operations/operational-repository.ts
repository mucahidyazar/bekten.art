import {z} from 'zod'

import {
  feedbackCreateSchema,
  feedbackRowSchema,
  uuidSchema,
} from '@/server/content/domain'

type FeedbackDelegate = Readonly<{
  create: (args: unknown) => Promise<unknown>
  deleteMany: (args: unknown) => Promise<{count: number}>
  findUnique: (args: unknown) => Promise<unknown | null>
  updateMany: (args: unknown) => Promise<{count: number}>
}>

type OperationalTransaction = Readonly<{
  auditEvent: Readonly<{create: (args: unknown) => Promise<unknown>}>
  feedback: FeedbackDelegate
  outboxJob: Readonly<{create: (args: unknown) => Promise<unknown>}>
  user: Readonly<{deleteMany: (args: unknown) => Promise<{count: number}>}>
}>

export type OperationalDatabase = Readonly<{
  $transaction: <Result>(
    callback: (transaction: OperationalTransaction) => Promise<Result>,
  ) => Promise<Result>
}>

const feedbackStatusSchema = z.enum(['NEW', 'IN_REVIEW', 'RESOLVED', 'SPAM'])

function deletedEntityAudit(
  actorUserId: string,
  entityId: string,
  entityType: 'Feedback' | 'User',
) {
  return {
    action: `${entityType.toLowerCase()}.deleted`,
    actorUserId,
    entityId,
    entityType,
    metadata: {},
  }
}

export function createOperationalRepository(
  database: OperationalDatabase,
  dependencies: Readonly<{now?: () => Date}> = {},
) {
  const now = dependencies.now ?? (() => new Date())

  return Object.freeze({
    async createFeedback(input: z.input<typeof feedbackCreateSchema>) {
      const parsed = feedbackCreateSchema.parse(input)
      const createdAt = now()
      const purgeAfter = new Date(createdAt)

      purgeAfter.setUTCFullYear(purgeAfter.getUTCFullYear() + 1)

      return database.$transaction(async transaction => {
        const row = await transaction.feedback.create({
          data: {...parsed, purgeAfter},
        })
        const feedback = feedbackRowSchema.parse(row)

        await transaction.outboxJob.create({
          data: {
            idempotencyKey: `feedback.created:${feedback.id}`,
            payload: {feedbackId: feedback.id},
            type: 'feedback.created',
          },
        })

        return feedback
      })
    },
    async removeFeedback(idInput: string, actorUserIdInput: string) {
      const id = uuidSchema.parse(idInput)
      const actorUserId = uuidSchema.parse(actorUserIdInput)

      return database.$transaction(async transaction => {
        const deleted = await transaction.feedback.deleteMany({where: {id}})

        if (deleted.count !== 1) throw new Error('Feedback not found')

        await transaction.auditEvent.create({
          data: deletedEntityAudit(actorUserId, id, 'Feedback'),
        })
      })
    },
    async removeUser(idInput: string, actorUserIdInput: string) {
      const id = uuidSchema.parse(idInput)
      const actorUserId = uuidSchema.parse(actorUserIdInput)

      if (id === actorUserId) {
        throw new Error('You cannot remove your own administrator account')
      }

      return database.$transaction(async transaction => {
        const deleted = await transaction.user.deleteMany({where: {id}})

        if (deleted.count !== 1) throw new Error('User not found')

        await transaction.auditEvent.create({
          data: deletedEntityAudit(actorUserId, id, 'User'),
        })
      })
    },
    async updateFeedback(
      idInput: string,
      statusInput: z.input<typeof feedbackStatusSchema>,
      actorUserIdInput: string,
    ) {
      const id = uuidSchema.parse(idInput)
      const status = feedbackStatusSchema.parse(statusInput)
      const actorUserId = uuidSchema.parse(actorUserIdInput)
      const resolvedAt = status === 'RESOLVED' ? now() : null

      return database.$transaction(async transaction => {
        const updated = await transaction.feedback.updateMany({
          data: {
            resolvedAt,
            resolvedByUserId: status === 'RESOLVED' ? actorUserId : null,
            status,
          },
          where: {id},
        })

        if (updated.count !== 1) throw new Error('Feedback not found')

        const row = await transaction.feedback.findUnique({where: {id}})

        await transaction.auditEvent.create({
          data: {
            action: 'feedback.status_updated',
            actorUserId,
            entityId: id,
            entityType: 'Feedback',
            metadata: {status},
          },
        })

        return feedbackRowSchema.parse(row)
      })
    },
  })
}
