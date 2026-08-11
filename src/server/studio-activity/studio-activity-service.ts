import {z} from 'zod'

const filterTextSchema = z.string().trim().max(120).optional()
const activityFilterSchema = z
  .object({
    action: filterTextSchema,
    actor: filterTextSchema,
    entity: filterTextSchema,
    from: z.iso.datetime().optional(),
    page: z.coerce.number().int().min(1).max(1_000).default(1),
    to: z.iso.datetime().optional(),
  })
  .strict()

type StudioActivityFilter = z.input<typeof activityFilterSchema>
type StudioActivityQuery = z.output<typeof activityFilterSchema> & {
  pageSize: 50
}
type StudioActivityEvent = Readonly<{
  action: string
  actor: Readonly<{email: string | null; name: string | null}> | null
  actorUserId: string | null
  createdAt: Date
  entityId: string | null
  entityType: string
  id: string
  metadata: unknown
}>
type StudioActivityRepository = Readonly<{
  list: (query: StudioActivityQuery) => Promise<
    Readonly<{
      events: readonly StudioActivityEvent[]
      total: number
    }>
  >
}>

const metadataAllowlist = new Set([
  'contentType',
  'fieldCount',
  'from',
  'locale',
  'role',
  'sizeBytes',
  'status',
  'to',
  'type',
])

function safeMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key, entry]) =>
          metadataAllowlist.has(key) &&
          (typeof entry === 'string' ||
            typeof entry === 'number' ||
            typeof entry === 'boolean' ||
            entry === null),
      )
      .slice(0, 12),
  )
}

export type {
  StudioActivityEvent,
  StudioActivityFilter,
  StudioActivityQuery,
  StudioActivityRepository,
}

export function createStudioActivityService(
  repository: StudioActivityRepository,
) {
  return Object.freeze({
    async list(candidate: StudioActivityFilter) {
      let filter: z.output<typeof activityFilterSchema>

      try {
        filter = activityFilterSchema.parse(candidate)
      } catch {
        throw new Error('STUDIO_ACTIVITY_FILTER_INVALID')
      }

      const result = await repository.list({...filter, pageSize: 50})

      return Object.freeze({
        events: result.events.map(event =>
          Object.freeze({...event, metadata: safeMetadata(event.metadata)}),
        ),
        page: filter.page,
        pageSize: 50,
        total: result.total,
      })
    },
  })
}
