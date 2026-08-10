export const CACHE_REVALIDATION_JOB_TYPE = 'editorial.cache-revalidate' as const

export type CacheRevalidationJob = Readonly<{
  idempotencyKey: string
  maxAttempts: number
  payload: Readonly<{
    entityId: string
    entityType: EditorialEntityType
    locale: EditorialLocale
    paths: readonly string[]
    version: number
  }>
  type: typeof CACHE_REVALIDATION_JOB_TYPE
}>

export type EditorialAggregate = Readonly<{
  draftSnapshot: EditorialSnapshot
  entityId: string
  entityType: EditorialEntityType
  locale: EditorialLocale
  publishedAt: Date | null
  publishedSnapshot: EditorialSnapshot | null
  slug: string
  status: EditorialStatus
  version: number
}>

export type EditorialAggregateValidationInput = Readonly<{
  entityId: string
  entityType: EditorialEntityType
  locale: EditorialLocale
  slug: string
  snapshot: EditorialSnapshot
}>

export type EditorialAggregateValidator = (
  input: EditorialAggregateValidationInput,
) => EditorialSnapshot | Promise<EditorialSnapshot>

export type EditorialAuditEventCreate = Readonly<{
  action: 'editorial.published' | 'editorial.restored'
  actorUserId: string
  entityId: string
  entityType: EditorialEntityType
  metadata: Readonly<Record<string, string | number>>
}>

export type EditorialEntityReference = Readonly<{
  entityId: string
  entityType: EditorialEntityType
}>

export type EditorialEntityType =
  | 'ARTWORK'
  | 'COLLECTION'
  | 'EXHIBITION'
  | 'JOURNAL_ENTRY'
  | 'PAGE'
  | 'PRESS_ENTRY'

export type EditorialJsonPrimitive = boolean | null | number | string

export type EditorialJsonValue =
  EditorialJsonPrimitive | EditorialSnapshot | readonly EditorialJsonValue[]

export type EditorialLocale = 'en' | 'ky' | 'ru' | 'tr'

export type EditorialPublishedStateUpdate = Readonly<{
  entityId: string
  entityType: EditorialEntityType
  expectedVersion: number
  nextVersion: number
  publishedAt: Date
  publishedSnapshot: EditorialSnapshot
  status: 'PUBLISHED'
}>

export type EditorialPublishingDependencies = Readonly<{
  now?: () => Date
  validateAggregate: EditorialAggregateValidator
}>

export interface EditorialPublishingRepository {
  withTransaction<Result>(
    callback: (transaction: EditorialPublishingTransaction) => Promise<Result>,
  ): Promise<Result>
}

export type EditorialPublishingResult = Readonly<{
  aggregate: EditorialAggregate
  revision: EditorialRevision
}>

export interface EditorialPublishingTransaction {
  createAuditEvent(input: EditorialAuditEventCreate): Promise<void>
  createRevision(input: EditorialRevisionCreate): Promise<EditorialRevision>
  enqueueCacheRevalidation(input: CacheRevalidationJob): Promise<void>
  findAggregate(
    input: EditorialEntityReference,
  ): Promise<EditorialAggregate | null>
  findRevision(
    input: EditorialRevisionReference,
  ): Promise<EditorialRevision | null>
  updatePublishedState(
    input: EditorialPublishedStateUpdate,
  ): Promise<EditorialAggregate | null>
}

export type EditorialRevision = Readonly<{
  actorUserId: string | null
  createdAt: Date
  entityId: string
  entityType: EditorialEntityType
  id: string
  locale: EditorialLocale
  operation: EditorialRevisionOperation
  snapshot: EditorialSnapshot
  sourceRevisionId: string | null
  version: number
}>

export type EditorialRevisionCreate = Readonly<
  Omit<EditorialRevision, 'actorUserId' | 'id'> & {actorUserId: string}
>

export type EditorialRevisionOperation = 'PUBLISH' | 'RESTORE'

export type EditorialRevisionReference = EditorialEntityReference &
  Readonly<{revisionId: string}>

export type EditorialSnapshot = Readonly<{
  [key: string]: EditorialJsonValue
}>

export type EditorialStatus = 'ARCHIVED' | 'DRAFT' | 'PUBLISHED'

export const MAX_CACHE_REVALIDATION_ATTEMPTS = 5
export const MAX_CACHE_REVALIDATION_PATHS = 20
export const MAX_EDITORIAL_VERSION = 2_147_483_647

export type PublishEditorialCommand = EditorialEntityReference &
  Readonly<{
    actorUserId: string
    expectedVersion: number
    revalidationPaths: readonly string[]
  }>

export type RestoreEditorialCommand = PublishEditorialCommand &
  Readonly<{revisionId: string}>
