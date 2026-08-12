type IdRow = Readonly<{id: string}>
type RateLimitRow = Readonly<{action: string; key: string}>
type VerificationTokenRow = Readonly<{identifier: string; token: string}>

type RetentionDelegate<Row> = Readonly<{
  deleteMany: (args: unknown) => Promise<Readonly<{count: number}>>
  findMany: (args: unknown) => Promise<readonly Row[]>
}>

export type RetentionDatabase = Readonly<{
  emailWebhookEvent: RetentionDelegate<IdRow>
  feedback: RetentionDelegate<IdRow>
  inquiry: RetentionDelegate<IdRow>
  outboxJob: RetentionDelegate<IdRow>
  rateLimitBucket: RetentionDelegate<RateLimitRow>
  session: RetentionDelegate<IdRow>
  verificationToken: RetentionDelegate<VerificationTokenRow>
}>

export type RetentionSummary = Readonly<{
  emailWebhookEvents: number
  feedback: number
  inquiries: number
  outboxJobs: number
  rateLimitBuckets: number
  sessions: number
  verificationTokens: number
}>

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000

function daysBefore(now: Date, days: number) {
  return new Date(now.getTime() - days * DAY_IN_MILLISECONDS)
}

function validateBatchSize(batchSize: number) {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1000) {
    throw new Error('batchSize must be an integer between 1 and 1000')
  }

  return batchSize
}

async function deleteIds(
  delegate: RetentionDelegate<IdRow>,
  rows: readonly IdRow[],
) {
  if (rows.length === 0) return 0

  const result = await delegate.deleteMany({
    where: {id: {in: rows.map(({id}) => id)}},
  })

  return result.count
}

export function createRetentionService(
  database: RetentionDatabase,
  dependencies: Readonly<{batchSize?: number; now?: () => Date}> = {},
) {
  const batchSize = validateBatchSize(dependencies.batchSize ?? 500)
  const nowProvider = dependencies.now ?? (() => new Date())

  return Object.freeze({
    async run(): Promise<RetentionSummary> {
      const now = nowProvider()
      const [
        feedbackRows,
        inquiryRows,
        rateLimitRows,
        outboxRows,
        webhookRows,
        verificationRows,
        sessionRows,
      ] = await Promise.all([
        database.feedback.findMany({
          orderBy: {purgeAfter: 'asc'},
          select: {id: true},
          take: batchSize,
          where: {purgeAfter: {lte: now}},
        }),
        database.inquiry.findMany({
          orderBy: {purgeAfter: 'asc'},
          select: {id: true},
          take: batchSize,
          where: {purgeAfter: {lte: now}},
        }),
        database.rateLimitBucket.findMany({
          orderBy: {updatedAt: 'asc'},
          select: {action: true, key: true},
          take: batchSize,
          where: {updatedAt: {lt: daysBefore(now, 2)}},
        }),
        database.outboxJob.findMany({
          orderBy: {completedAt: 'asc'},
          select: {id: true},
          take: batchSize,
          where: {
            completedAt: {lt: daysBefore(now, 30)},
            status: 'COMPLETED',
          },
        }),
        database.emailWebhookEvent.findMany({
          orderBy: {createdAt: 'asc'},
          select: {id: true},
          take: batchSize,
          where: {createdAt: {lt: daysBefore(now, 90)}},
        }),
        database.verificationToken.findMany({
          orderBy: {expires: 'asc'},
          select: {identifier: true, token: true},
          take: batchSize,
          where: {expires: {lt: now}},
        }),
        database.session.findMany({
          orderBy: {expires: 'asc'},
          select: {id: true},
          take: batchSize,
          where: {expires: {lt: now}},
        }),
      ])

      const deletionTasks = [
        deleteIds(database.feedback, feedbackRows),
        deleteIds(database.inquiry, inquiryRows),
        rateLimitRows.length === 0
          ? Promise.resolve(0)
          : database.rateLimitBucket
              .deleteMany({
                where: {
                  OR: rateLimitRows.map(({action, key}) => ({action, key})),
                },
              })
              .then(({count}) => count),
        deleteIds(database.outboxJob, outboxRows),
        deleteIds(database.emailWebhookEvent, webhookRows),
        verificationRows.length === 0
          ? Promise.resolve(0)
          : database.verificationToken
              .deleteMany({
                where: {
                  OR: verificationRows.map(({identifier, token}) => ({
                    identifier,
                    token,
                  })),
                },
              })
              .then(({count}) => count),
        deleteIds(database.session, sessionRows),
      ] as const

      const [
        feedback,
        inquiries,
        rateLimitBuckets,
        outboxJobs,
        emailWebhookEvents,
        verificationTokens,
        sessions,
      ] = await Promise.all(deletionTasks)

      return {
        emailWebhookEvents,
        feedback,
        inquiries,
        outboxJobs,
        rateLimitBuckets,
        sessions,
        verificationTokens,
      }
    },
  })
}
