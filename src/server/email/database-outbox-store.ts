import type {OutboxStore} from './outbox-dispatcher'

export type OutboxDatabase = Readonly<{
  $queryRaw: <Result>(
    strings: TemplateStringsArray,
    ...values: readonly unknown[]
  ) => Promise<Result>
  feedback: Readonly<{
    findUnique: (args: unknown) => Promise<unknown | null>
  }>
  inquiry: Readonly<{
    findUnique: (args: unknown) => Promise<unknown | null>
  }>
  newsletterSubscriber: Readonly<{
    findUnique: (args: unknown) => Promise<unknown | null>
  }>
  outboxJob: Readonly<{
    updateMany: (args: unknown) => Promise<Readonly<{count: number}>>
  }>
}>

export function createDatabaseOutboxStore(
  database: OutboxDatabase,
): OutboxStore {
  return Object.freeze({
    async claim(input) {
      const claimed = await database.$queryRaw<unknown[]>`
        WITH candidate AS (
          SELECT id
          FROM outbox_jobs
          WHERE
            attempts < max_attempts
            AND (
              (
                status = 'PENDING'::"OutboxStatus"
                AND available_at <= ${input.now}
              )
              OR (
                status = 'PROCESSING'::"OutboxStatus"
                AND locked_at <= ${input.lockExpiredBefore}
              )
            )
          ORDER BY available_at ASC, created_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        UPDATE outbox_jobs AS job
        SET
          status = 'PROCESSING'::"OutboxStatus",
          attempts = job.attempts + 1,
          locked_at = ${input.now},
          locked_by = ${input.workerId},
          updated_at = ${input.now}
        FROM candidate
        WHERE job.id = candidate.id
        RETURNING
          job.id,
          job.type,
          job.payload,
          job.idempotency_key AS "idempotencyKey",
          job.status,
          job.attempts,
          job.max_attempts AS "maxAttempts",
          job.available_at AS "availableAt",
          job.locked_at AS "lockedAt",
          job.locked_by AS "lockedBy",
          job.last_error AS "lastError",
          job.completed_at AS "completedAt",
          job.created_at AS "createdAt",
          job.updated_at AS "updatedAt"
      `

      return claimed[0] ?? null
    },
    async complete(id, workerId, completedAt) {
      const updated = await database.outboxJob.updateMany({
        data: {
          completedAt,
          lastError: null,
          lockedAt: null,
          lockedBy: null,
          status: 'COMPLETED',
        },
        where: {id, lockedBy: workerId, status: 'PROCESSING'},
      })

      return updated.count === 1
    },
    async findFeedback(id) {
      return database.feedback.findUnique({
        select: {
          email: true,
          message: true,
          name: true,
          subject: true,
        },
        where: {id},
      }) as ReturnType<OutboxStore['findFeedback']>
    },
    async findInquiry(id) {
      return database.inquiry.findUnique({
        select: {
          brief: true,
          email: true,
          locale: true,
          message: true,
          name: true,
          relatedArtworkTitle: true,
          subject: true,
          type: true,
        },
        where: {id},
      }) as ReturnType<OutboxStore['findInquiry']>
    },
    async findSubscriber(id) {
      return database.newsletterSubscriber.findUnique({
        select: {email: true, locale: true},
        where: {id},
      }) as ReturnType<OutboxStore['findSubscriber']>
    },
    async retry(id, workerId, input) {
      const updated = await database.outboxJob.updateMany({
        data: {
          availableAt: input.availableAt,
          lastError: input.error.slice(0, 200),
          lockedAt: null,
          lockedBy: null,
          status: input.terminal ? 'FAILED' : 'PENDING',
        },
        where: {id, lockedBy: workerId, status: 'PROCESSING'},
      })

      return updated.count === 1
    },
  })
}
