import {z} from 'zod'

import {
  CACHE_REVALIDATION_JOB_TYPE,
  MAX_CACHE_REVALIDATION_ATTEMPTS,
  MAX_CACHE_REVALIDATION_PATHS,
  MAX_EDITORIAL_VERSION,
} from './contracts'
import {
  EditorialContentNotFoundError,
  EditorialRevisionNotFoundError,
  EditorialVersionConflictError,
} from './publishing-errors'
import {toImmutableEditorialSnapshot} from './snapshot'

import type {
  CacheRevalidationJob,
  EditorialAggregate,
  EditorialAuditEventCreate,
  EditorialEntityReference,
  EditorialPublishingDependencies,
  EditorialPublishingRepository,
  EditorialPublishingResult,
  EditorialPublishingTransaction,
  EditorialRevision,
  EditorialRevisionOperation,
  EditorialSnapshot,
  PublishEditorialCommand,
  RestoreEditorialCommand,
} from './contracts'

const entityTypeSchema = z.enum([
  'ARTWORK',
  'COLLECTION',
  'EXHIBITION',
  'JOURNAL_ENTRY',
  'PAGE',
  'PRESS_ENTRY',
])
const revalidationPathSchema = z
  .string()
  .min(1)
  .max(512)
  .regex(
    /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/?)*$/,
    'Revalidation path must use lowercase kebab-case application segments',
  )
  .refine(
    path => !/[?#\\]/.test(path),
    'Revalidation path cannot contain a query or hash',
  )
  .refine(
    path =>
      !path.split('/').some(segment => segment === '.' || segment === '..'),
    'Revalidation path cannot traverse directories',
  )
const revalidationPathsSchema = z
  .array(revalidationPathSchema)
  .min(1)
  .max(MAX_CACHE_REVALIDATION_PATHS)
  .superRefine((paths, context) => {
    if (new Set(paths).size !== paths.length) {
      context.addIssue({
        code: 'custom',
        message: 'Revalidation paths must be unique',
      })
    }
  })
const publishCommandSchema = z
  .object({
    actorUserId: z.string().uuid(),
    entityId: z.string().uuid(),
    entityType: entityTypeSchema,
    expectedVersion: z
      .number()
      .int()
      .positive()
      .max(MAX_EDITORIAL_VERSION - 1),
    revalidationPaths: revalidationPathsSchema,
  })
  .strict()
const restoreCommandSchema = publishCommandSchema.extend({
  revisionId: z.string().uuid(),
})

type PublicationContext = Readonly<{
  actorUserId: string
  aggregate: EditorialAggregate
  operation: EditorialRevisionOperation
  revalidationPaths: readonly string[]
  snapshot: EditorialSnapshot
  sourceRevision: EditorialRevision | null
}>

function auditEvent(
  context: PublicationContext,
  revision: EditorialRevision,
): EditorialAuditEventCreate {
  const shared = {
    actorUserId: context.actorUserId,
    entityId: context.aggregate.entityId,
    entityType: context.aggregate.entityType,
  }

  if (context.operation === 'PUBLISH') {
    return Object.freeze({
      ...shared,
      action: 'editorial.published',
      metadata: Object.freeze({
        fromVersion: context.aggregate.version,
        revisionId: revision.id,
        toVersion: revision.version,
      }),
    })
  }

  return Object.freeze({
    ...shared,
    action: 'editorial.restored',
    metadata: Object.freeze({
      fromVersion: context.aggregate.version,
      revisionId: revision.id,
      sourceRevisionId: context.sourceRevision?.id ?? '',
      sourceVersion: context.sourceRevision?.version ?? 0,
      toVersion: revision.version,
    }),
  })
}

function cacheRevalidationJob(
  context: PublicationContext,
  version: number,
): CacheRevalidationJob {
  return Object.freeze({
    idempotencyKey: `${CACHE_REVALIDATION_JOB_TYPE}:${context.aggregate.entityType}:${context.aggregate.entityId}:v${version}`,
    maxAttempts: MAX_CACHE_REVALIDATION_ATTEMPTS,
    payload: Object.freeze({
      entityId: context.aggregate.entityId,
      entityType: context.aggregate.entityType,
      locale: context.aggregate.locale,
      paths: Object.freeze([...context.revalidationPaths]),
      version,
    }),
    type: CACHE_REVALIDATION_JOB_TYPE,
  })
}

function immutableAggregate(
  aggregate: EditorialAggregate,
  snapshot: EditorialSnapshot,
): EditorialAggregate {
  return Object.freeze({
    ...aggregate,
    draftSnapshot: toImmutableEditorialSnapshot(aggregate.draftSnapshot),
    publishedSnapshot: snapshot,
  })
}

function immutableRevision(
  revision: EditorialRevision,
  snapshot: EditorialSnapshot,
): EditorialRevision {
  return Object.freeze({...revision, snapshot})
}

function matchesHistoricalRevision(
  revision: EditorialRevision,
  expected: EditorialEntityReference & Readonly<{revisionId: string}>,
  currentVersion: number,
): boolean {
  return (
    revision.id === expected.revisionId &&
    revision.entityId === expected.entityId &&
    revision.entityType === expected.entityType &&
    Number.isSafeInteger(revision.version) &&
    revision.version > 0 &&
    revision.version <= currentVersion
  )
}

async function persistPublication(
  transaction: EditorialPublishingTransaction,
  context: PublicationContext,
  publishedAt: Date,
): Promise<EditorialPublishingResult> {
  const nextVersion = context.aggregate.version + 1
  const revision = await transaction.createRevision({
    actorUserId: context.actorUserId,
    createdAt: publishedAt,
    entityId: context.aggregate.entityId,
    entityType: context.aggregate.entityType,
    locale: context.aggregate.locale,
    operation: context.operation,
    snapshot: context.snapshot,
    sourceRevisionId: context.sourceRevision?.id ?? null,
    version: nextVersion,
  })
  const updated = await transaction.updatePublishedState({
    entityId: context.aggregate.entityId,
    entityType: context.aggregate.entityType,
    expectedVersion: context.aggregate.version,
    nextVersion,
    publishedAt,
    publishedSnapshot: context.snapshot,
    status: 'PUBLISHED',
  })

  if (!updated) {
    throw new EditorialVersionConflictError(
      context.aggregate.version,
      context.aggregate.version + 1,
    )
  }

  const stableRevision = immutableRevision(revision, context.snapshot)

  await transaction.createAuditEvent(auditEvent(context, stableRevision))
  await transaction.enqueueCacheRevalidation(
    cacheRevalidationJob(context, nextVersion),
  )

  return Object.freeze({
    aggregate: immutableAggregate(updated, context.snapshot),
    revision: stableRevision,
  })
}

function requireExpectedVersion(
  aggregate: EditorialAggregate,
  expectedVersion: number,
) {
  if (aggregate.version !== expectedVersion) {
    throw new EditorialVersionConflictError(expectedVersion, aggregate.version)
  }
}

export function createEditorialPublishingService(
  repository: EditorialPublishingRepository,
  dependencies: EditorialPublishingDependencies,
) {
  const now = dependencies.now ?? (() => new Date())

  return Object.freeze({
    async publish(
      input: PublishEditorialCommand,
    ): Promise<EditorialPublishingResult> {
      const command = publishCommandSchema.parse(input)

      return repository.withTransaction(async transaction => {
        const aggregate = await transaction.findAggregate({
          entityId: command.entityId,
          entityType: command.entityType,
        })

        if (!aggregate) throw new EditorialContentNotFoundError()

        requireExpectedVersion(aggregate, command.expectedVersion)

        const candidate = toImmutableEditorialSnapshot(aggregate.draftSnapshot)
        const validated = await dependencies.validateAggregate({
          entityId: aggregate.entityId,
          entityType: aggregate.entityType,
          locale: aggregate.locale,
          slug: aggregate.slug,
          snapshot: candidate,
        })
        const snapshot = toImmutableEditorialSnapshot(validated)

        return persistPublication(
          transaction,
          {
            actorUserId: command.actorUserId,
            aggregate,
            operation: 'PUBLISH',
            revalidationPaths: command.revalidationPaths,
            snapshot,
            sourceRevision: null,
          },
          now(),
        )
      })
    },
    async restore(
      input: RestoreEditorialCommand,
    ): Promise<EditorialPublishingResult> {
      const command = restoreCommandSchema.parse(input)

      return repository.withTransaction(async transaction => {
        const aggregate = await transaction.findAggregate({
          entityId: command.entityId,
          entityType: command.entityType,
        })

        if (!aggregate) throw new EditorialContentNotFoundError()

        requireExpectedVersion(aggregate, command.expectedVersion)

        const sourceRevision = await transaction.findRevision({
          entityId: command.entityId,
          entityType: command.entityType,
          revisionId: command.revisionId,
        })

        if (
          !sourceRevision ||
          !matchesHistoricalRevision(sourceRevision, command, aggregate.version)
        ) {
          throw new EditorialRevisionNotFoundError()
        }

        const candidate = toImmutableEditorialSnapshot(sourceRevision.snapshot)
        const validated = await dependencies.validateAggregate({
          entityId: aggregate.entityId,
          entityType: aggregate.entityType,
          locale: aggregate.locale,
          slug: aggregate.slug,
          snapshot: candidate,
        })
        const snapshot = toImmutableEditorialSnapshot(validated)

        return persistPublication(
          transaction,
          {
            actorUserId: command.actorUserId,
            aggregate,
            operation: 'RESTORE',
            revalidationPaths: command.revalidationPaths,
            snapshot,
            sourceRevision,
          },
          now(),
        )
      })
    },
  })
}
