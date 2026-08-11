import {z} from 'zod'

import {
  editorialLocaleSchema,
  editorialStatusSchema,
  kebabSlugSchema,
  uuidSchema,
} from '@/server/editorial-content'
import {toImmutableEditorialSnapshot} from '@/server/editorial-publishing/snapshot'

import type {
  CacheRevalidationJob,
  EditorialAggregate,
  EditorialAuditEventCreate,
  EditorialEntityType,
  EditorialPublishingRepository,
  EditorialPublishingTransaction,
  EditorialPublishedStateUpdate,
  EditorialRevision,
  EditorialRevisionCreate,
  EditorialRevisionReference,
  EditorialSnapshot,
} from '@/server/editorial-publishing/contracts'

type UnknownDelegate = Readonly<{
  findUnique: (args: unknown) => Promise<unknown | null>
  updateMany: (args: unknown) => Promise<Readonly<{count: number}>>
}>

type EditorialPublishingDatabaseTransaction = Readonly<{
  [delegate: string]: unknown
  auditEvent: Readonly<{create: (args: unknown) => Promise<unknown>}>
  contentMediaPlacement: Readonly<{
    findMany: (args: unknown) => Promise<readonly unknown[]>
  }>
  contentRevision: Readonly<{
    create: (args: unknown) => Promise<unknown>
    findFirst: (args: unknown) => Promise<unknown | null>
    findUnique: (args: unknown) => Promise<unknown | null>
  }>
  outboxJob: Readonly<{create: (args: unknown) => Promise<unknown>}>
}>

export type EditorialPublishingDatabase = Readonly<{
  $transaction: <Result>(
    callback: (
      transaction: EditorialPublishingDatabaseTransaction,
    ) => Promise<Result>,
  ) => Promise<Result>
}>

export type EditorialPublishingEntityCodec = Readonly<{
  delegate: string
  draftSnapshot: (
    row: Readonly<Record<string, unknown>>,
    mediaPlacements: readonly unknown[],
  ) => EditorialSnapshot
}>

export type EditorialPublishingEntityCodecs = Readonly<
  Partial<Record<EditorialEntityType, EditorialPublishingEntityCodec>>
>

const aggregateRowSchema = z
  .object({
    id: uuidSchema,
    locale: editorialLocaleSchema,
    publishedAt: z.date().nullable(),
    slug: kebabSlugSchema,
    status: editorialStatusSchema,
    version: z.number().int().positive(),
  })
  .passthrough()

const revisionRowSchema = z
  .object({
    actorUserId: uuidSchema.nullable(),
    createdAt: z.date(),
    entityId: uuidSchema,
    entityType: z.enum([
      'ARTWORK',
      'COLLECTION',
      'EXHIBITION',
      'JOURNAL_ENTRY',
      'PAGE',
      'PRESS_ENTRY',
    ]),
    id: uuidSchema,
    locale: editorialLocaleSchema,
    operation: z.enum(['PUBLISH', 'RESTORE']),
    snapshot: z.unknown(),
    sourceRevisionId: uuidSchema.nullable(),
    version: z.number().int().positive(),
  })
  .passthrough()

function entityCodec(
  codecs: EditorialPublishingEntityCodecs,
  entityType: EditorialEntityType,
) {
  const codec = codecs[entityType]

  if (!codec) {
    throw new Error('EDITORIAL_PERSISTENCE_ENTITY_UNSUPPORTED')
  }

  return codec
}

function delegate(
  transaction: EditorialPublishingDatabaseTransaction,
  name: string,
) {
  const selected = transaction[name] as Partial<UnknownDelegate> | undefined

  if (
    !selected ||
    typeof selected.findUnique !== 'function' ||
    typeof selected.updateMany !== 'function'
  ) {
    throw new Error('EDITORIAL_PERSISTENCE_CONFIGURATION_INVALID')
  }

  return selected as UnknownDelegate
}

function parseRevision(row: unknown): EditorialRevision {
  const parsed = revisionRowSchema.safeParse(row)

  if (!parsed.success) {
    throw new Error('EDITORIAL_PERSISTENCE_REVISION_INVALID')
  }

  return Object.freeze({
    actorUserId: parsed.data.actorUserId,
    createdAt: new Date(parsed.data.createdAt),
    entityId: parsed.data.entityId,
    entityType: parsed.data.entityType,
    id: parsed.data.id,
    locale: parsed.data.locale,
    operation: parsed.data.operation,
    snapshot: toImmutableEditorialSnapshot(parsed.data.snapshot),
    sourceRevisionId: parsed.data.sourceRevisionId,
    version: parsed.data.version,
  })
}

export function createDatabaseEditorialPublishingRepository(
  database: EditorialPublishingDatabase,
  codecs: EditorialPublishingEntityCodecs,
): EditorialPublishingRepository {
  return Object.freeze({
    withTransaction<Result>(
      callback: (transaction: EditorialPublishingTransaction) => Promise<Result>,
    ) {
      return database.$transaction(async databaseTransaction => {
        async function findAggregate(input: {
          entityId: string
          entityType: EditorialEntityType
        }): Promise<EditorialAggregate | null> {
          const codec = entityCodec(codecs, input.entityType)
          const entityDelegate = delegate(databaseTransaction, codec.delegate)
          const row = await entityDelegate.findUnique({
            where: {id: input.entityId},
          })

          if (row === null) return null

          const parsedRow = aggregateRowSchema.safeParse(row)

          if (!parsedRow.success) {
            throw new Error('EDITORIAL_PERSISTENCE_ROW_INVALID')
          }

          if (parsedRow.data.id !== input.entityId) {
            throw new Error('EDITORIAL_PERSISTENCE_ROW_INVALID')
          }

          const mediaPlacements =
            await databaseTransaction.contentMediaPlacement.findMany({
              orderBy: {displayOrder: 'asc'},
              where: {entityId: input.entityId, entityType: input.entityType},
            })
          const draftSnapshot = toImmutableEditorialSnapshot(
            codec.draftSnapshot(parsedRow.data, mediaPlacements),
          )
          let publishedSnapshot: EditorialSnapshot | null = null

          if (
            parsedRow.data.status === 'PUBLISHED' &&
            parsedRow.data.publishedAt
          ) {
            const latestRevision =
              await databaseTransaction.contentRevision.findFirst({
                orderBy: {version: 'desc'},
                where: {
                  entityId: input.entityId,
                  entityType: input.entityType,
                },
              })

            publishedSnapshot = latestRevision
              ? parseRevision(latestRevision).snapshot
              : null
          }

          return Object.freeze({
            draftSnapshot,
            entityId: parsedRow.data.id,
            entityType: input.entityType,
            locale: parsedRow.data.locale,
            publishedAt: parsedRow.data.publishedAt
              ? new Date(parsedRow.data.publishedAt)
              : null,
            publishedSnapshot,
            slug: parsedRow.data.slug,
            status: parsedRow.data.status,
            version: parsedRow.data.version,
          })
        }

        const transaction: EditorialPublishingTransaction = Object.freeze({
          async createAuditEvent(input: EditorialAuditEventCreate) {
            await databaseTransaction.auditEvent.create({
              data: {
                action: input.action,
                actorUserId: input.actorUserId,
                entityId: input.entityId,
                entityType: input.entityType,
                metadata: {...input.metadata},
              },
            })
          },
          async createRevision(input: EditorialRevisionCreate) {
            return parseRevision(
              await databaseTransaction.contentRevision.create({
                data: {
                  ...input,
                  snapshot: input.snapshot,
                },
              }),
            )
          },
          async enqueueCacheRevalidation(input: CacheRevalidationJob) {
            await databaseTransaction.outboxJob.create({
              data: {
                idempotencyKey: input.idempotencyKey,
                maxAttempts: input.maxAttempts,
                payload: {...input.payload, paths: [...input.payload.paths]},
                type: input.type,
              },
            })
          },
          findAggregate,
          async findRevision(input: EditorialRevisionReference) {
            const row = await databaseTransaction.contentRevision.findUnique({
              where: {id: input.revisionId},
            })

            if (!row) return null

            const revision = parseRevision(row)

            return revision.entityId === input.entityId &&
              revision.entityType === input.entityType
              ? revision
              : null
          },
          async updatePublishedState(input: EditorialPublishedStateUpdate) {
            const codec = entityCodec(codecs, input.entityType)
            const result = await delegate(
              databaseTransaction,
              codec.delegate,
            ).updateMany({
              data: {
                publishedAt: input.publishedAt,
                status: input.status,
                version: input.nextVersion,
              },
              where: {id: input.entityId, version: input.expectedVersion},
            })

            if (result.count !== 1) return null

            return findAggregate(input)
          },
        })

        return callback(transaction)
      })
    },
  })
}
