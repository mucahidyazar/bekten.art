import {z} from 'zod'

import {
  contentMediaPlacementPublicSchema,
  editorialLocaleSchema,
  kebabSlugSchema,
} from '@/server/editorial-content'
import {editorialEntityCodecs} from '@/server/editorial-persistence/editorial-entity-codecs'
import {toImmutableEditorialSnapshot} from '@/server/editorial-publishing'

import type {
  PublicArtwork,
  PublicCollection,
  PublicCollectionDetail,
  PublicEditorialMediaPlacement,
  PublicEditorialReader,
  PublicExhibition,
  PublicExhibitionDetail,
  PublicHomepage,
  PublicJournalEntry,
  PublicPage,
  PublicPressEntry,
} from './contracts'
import type {EditorialLocale} from '@/server/editorial-content'
import type {
  EditorialEntityType,
  EditorialSnapshot,
} from '@/server/editorial-publishing'

type EntityDelegate = Readonly<{
  findMany: (arguments_: unknown) => Promise<readonly unknown[]>
}>

type PublicEditorialTransaction = Readonly<{
  [delegate: string]: unknown
  contentRevision: EntityDelegate
  exhibitionArtwork: EntityDelegate
  mediaObject: EntityDelegate
}>

export type PublicEditorialDatabase = Readonly<{
  $transaction: <Result>(
    callback: (transaction: PublicEditorialTransaction) => Promise<Result>,
  ) => Promise<Result>
}>

type PublicEntityMap = Readonly<{
  ARTWORK: PublicArtwork
  COLLECTION: PublicCollection
  EXHIBITION: PublicExhibition
  JOURNAL_ENTRY: PublicJournalEntry
  PAGE: PublicPage
  PRESS_ENTRY: PublicPressEntry
}>

type Candidate<TType extends EditorialEntityType> = Readonly<{
  displayOrder: number
  id: string
  publishedAt: Date
  publicValue: PublicEntityMap[TType]
  snapshot: EditorialSnapshot
  version: number
}>

const PUBLIC_IMAGE_TYPES = new Set([
  'image/avif',
  'image/jpeg',
  'image/png',
  'image/webp',
])
const HOMEPAGE_LIMITS = Object.freeze({
  collections: 3,
  exhibitions: 3,
  journalEntries: 3,
  pressEntries: 4,
  works: 6,
})
const entityTypeSchema = z.enum([
  'ARTWORK',
  'COLLECTION',
  'EXHIBITION',
  'JOURNAL_ENTRY',
  'PAGE',
  'PRESS_ENTRY',
])
const publishedRowSchema = z
  .object({
    displayOrder: z.number().int().min(0),
    id: z.string().uuid(),
    locale: editorialLocaleSchema,
    publishedAt: z.date(),
    status: z.literal('PUBLISHED'),
    version: z.number().int().positive(),
  })
  .passthrough()
const revisionRowSchema = z
  .object({
    entityId: z.string().uuid(),
    entityType: entityTypeSchema,
    locale: editorialLocaleSchema,
    snapshot: z.unknown(),
    version: z.number().int().positive(),
  })
  .passthrough()
const publicValueSchema = z
  .object({
    locale: editorialLocaleSchema,
    mediaPlacements: z.array(contentMediaPlacementPublicSchema),
    publishedAt: z.date(),
    slug: kebabSlugSchema,
  })
  .passthrough()
const mediaRowSchema = z
  .object({
    height: z.number().int().positive().nullable(),
    id: z.string().uuid(),
    mimeType: z.string().refine(value => PUBLIC_IMAGE_TYPES.has(value)),
    provider: z.literal('garage'),
    status: z.literal('READY'),
    visibility: z.literal('PUBLIC'),
    width: z.number().int().positive().nullable(),
  })
  .passthrough()
const exhibitionArtworkRowSchema = z.object({
  artworkId: z.string().uuid(),
  displayOrder: z.number().int().min(0),
})

function entityDelegate(
  transaction: PublicEditorialTransaction,
  name: string,
) {
  const selected = transaction[name] as Partial<EntityDelegate> | undefined

  if (!selected || typeof selected.findMany !== 'function') {
    throw new Error('PUBLIC_EDITORIAL_CONFIGURATION_INVALID')
  }

  return selected as EntityDelegate
}

function immutableJson<T>(value: T): T {
  if (value instanceof Date) {
    return value.toISOString() as T
  }

  if (Array.isArray(value)) {
    return Object.freeze(value.map(item => immutableJson(item))) as T
  }

  if (value !== null && typeof value === 'object') {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, immutableJson(item)]),
      ),
    ) as T
  }

  return value
}

function publishedRows(
  rows: readonly unknown[],
  locale: EditorialLocale,
) {
  return rows.flatMap(row => {
    const parsed = publishedRowSchema.safeParse(row)

    return parsed.success && parsed.data.locale === locale ? [parsed.data] : []
  })
}

function latestRevisions(
  rows: readonly unknown[],
  entityType: EditorialEntityType,
  locale: EditorialLocale,
  publishedRowsById: ReadonlyMap<string, z.output<typeof publishedRowSchema>>,
) {
  const latest = new Map<string, z.output<typeof revisionRowSchema>>()

  for (const row of rows) {
    const parsed = revisionRowSchema.safeParse(row)

    if (!parsed.success) continue

    const revision = parsed.data
    const publishedRow = publishedRowsById.get(revision.entityId)

    if (
      !publishedRow ||
      revision.entityType !== entityType ||
      revision.locale !== locale ||
      revision.version > publishedRow.version
    ) {
      continue
    }

    const current = latest.get(revision.entityId)

    if (!current || revision.version > current.version) {
      latest.set(revision.entityId, revision)
    }
  }

  return latest
}

function provisionalCandidate<TType extends EditorialEntityType>(
  entityType: TType,
  row: z.output<typeof publishedRowSchema>,
  revision: z.output<typeof revisionRowSchema> | undefined,
): Omit<Candidate<TType>, 'publicValue'> | null {
  if (!revision) return null

  try {
    const snapshot = toImmutableEditorialSnapshot(revision.snapshot)
    const parsed = publicValueSchema.parse(
      editorialEntityCodecs[entityType].publicFromSnapshot(
        snapshot,
        row.publishedAt,
      ),
    )
    const displayOrder = z.number().int().min(0).parse(snapshot.displayOrder)

    return Object.freeze({
      displayOrder,
      id: row.id,
      publishedAt: parsed.publishedAt,
      snapshot,
      version: revision.version,
    })
  } catch {
    return null
  }
}

function eligibleMedia(rows: readonly unknown[]) {
  return new Map(
    rows.flatMap(row => {
      const parsed = mediaRowSchema.safeParse(row)

      return parsed.success ? [[parsed.data.id, parsed.data] as const] : []
    }),
  )
}

function publicPlacement(
  placement: z.output<typeof contentMediaPlacementPublicSchema>,
  media: z.output<typeof mediaRowSchema>,
): PublicEditorialMediaPlacement {
  return immutableJson({
    ...placement,
    height: media.height,
    mimeType: media.mimeType,
    url: `/api/media/${media.id}`,
    width: media.width,
  })
}

function completeCandidate<TType extends EditorialEntityType>(
  entityType: TType,
  candidate: Omit<Candidate<TType>, 'publicValue'>,
  mediaById: ReadonlyMap<string, z.output<typeof mediaRowSchema>>,
): Candidate<TType> | null {
  try {
    const source = publicValueSchema.parse(
      editorialEntityCodecs[entityType].publicFromSnapshot(
        candidate.snapshot,
        candidate.publishedAt,
      ),
    )
    const eligiblePlacements = source.mediaPlacements.filter(placement =>
      mediaById.has(placement.mediaObjectId),
    )
    const filteredSnapshot = toImmutableEditorialSnapshot({
      ...candidate.snapshot,
      mediaPlacements: eligiblePlacements,
    })
    const validated = publicValueSchema.parse(
      editorialEntityCodecs[entityType].publicFromSnapshot(
        filteredSnapshot,
        candidate.publishedAt,
      ),
    )
    const publicValue = immutableJson({
      ...validated,
      id: candidate.id,
      mediaPlacements: validated.mediaPlacements.map(placement =>
        publicPlacement(placement, mediaById.get(placement.mediaObjectId)!),
      ),
    }) as unknown as PublicEntityMap[TType]

    return Object.freeze({...candidate, publicValue})
  } catch {
    return null
  }
}

function compareCandidates<TType extends EditorialEntityType>(
  left: Candidate<TType>,
  right: Candidate<TType>,
) {
  return (
    left.displayOrder - right.displayOrder ||
    left.publicValue.slug.localeCompare(right.publicValue.slug) ||
    left.id.localeCompare(right.id)
  )
}

async function readEntities<TType extends EditorialEntityType>(
  transaction: PublicEditorialTransaction,
  entityType: TType,
  locale: EditorialLocale,
): Promise<readonly PublicEntityMap[TType][]> {
  const codec = editorialEntityCodecs[entityType]
  const rows = publishedRows(
    await entityDelegate(transaction, codec.delegate).findMany({
      orderBy: [{displayOrder: 'asc'}, {id: 'asc'}],
      where: {locale, publishedAt: {not: null}, status: 'PUBLISHED'},
    }),
    locale,
  )

  if (rows.length === 0) return Object.freeze([])

  const rowsById = new Map(rows.map(row => [row.id, row]))
  const revisions = latestRevisions(
    await transaction.contentRevision.findMany({
      orderBy: [{entityId: 'asc'}, {version: 'desc'}],
      where: {entityId: {in: [...rowsById.keys()]}, entityType, locale},
    }),
    entityType,
    locale,
    rowsById,
  )
  const provisional = rows.flatMap(row => {
    const candidate = provisionalCandidate(
      entityType,
      row,
      revisions.get(row.id),
    )

    return candidate ? [candidate] : []
  })
  const mediaObjectIds = [
    ...new Set(
      provisional.flatMap(candidate => {
        const parsed = publicValueSchema.safeParse(
          editorialEntityCodecs[entityType].publicFromSnapshot(
            candidate.snapshot,
            candidate.publishedAt,
          ),
        )

        return parsed.success
          ? parsed.data.mediaPlacements.map(({mediaObjectId}) => mediaObjectId)
          : []
      }),
    ),
  ]
  const mediaById =
    mediaObjectIds.length === 0
      ? new Map<string, z.output<typeof mediaRowSchema>>()
      : eligibleMedia(
          await transaction.mediaObject.findMany({
            select: {
              height: true,
              id: true,
              mimeType: true,
              provider: true,
              status: true,
              visibility: true,
              width: true,
            },
            where: {
              id: {in: mediaObjectIds},
              mimeType: {in: [...PUBLIC_IMAGE_TYPES]},
              provider: 'garage',
              status: 'READY',
              visibility: 'PUBLIC',
            },
          }),
        )
  const complete = provisional.flatMap(candidate => {
    const result = completeCandidate(entityType, candidate, mediaById)

    return result ? [result] : []
  })

  complete.sort(compareCandidates)

  return Object.freeze(complete.map(({publicValue}) => publicValue))
}

function immutableDetail<T extends object>(value: T): Readonly<T> {
  return Object.freeze(value)
}

export function createDatabasePublicEditorialReader(
  database: PublicEditorialDatabase,
): PublicEditorialReader {
  function read<Result>(
    callback: (transaction: PublicEditorialTransaction) => Promise<Result>,
  ) {
    return database.$transaction(callback).catch(() => {
      throw new Error('PUBLIC_EDITORIAL_READ_FAILED')
    })
  }

  function locale(value: EditorialLocale) {
    return editorialLocaleSchema.parse(value)
  }

  function slug(value: string) {
    return kebabSlugSchema.parse(value)
  }

  const reader: PublicEditorialReader = {
    async getCollection(localeInput, slugInput) {
      const validLocale = locale(localeInput)
      const validSlug = slug(slugInput)

      return await read(async transaction => {
        const collections = await readEntities(
          transaction,
          'COLLECTION',
          validLocale,
        )
        const collection = collections.find(item => item.slug === validSlug)

        if (!collection) return null

        const works = await readEntities(transaction, 'ARTWORK', validLocale)

        return immutableDetail({
          collection,
          works: Object.freeze(
            works.filter(work => work.collectionId === collection.id),
          ),
        }) satisfies PublicCollectionDetail
      })
    },
    async getExhibition(localeInput, slugInput) {
      const validLocale = locale(localeInput)
      const validSlug = slug(slugInput)

      return await read(async transaction => {
        const exhibitions = await readEntities(
          transaction,
          'EXHIBITION',
          validLocale,
        )
        const exhibition = exhibitions.find(item => item.slug === validSlug)

        if (!exhibition) return null

        const joins = (
          await transaction.exhibitionArtwork.findMany({
            orderBy: [{displayOrder: 'asc'}, {artworkId: 'asc'}],
            where: {exhibitionId: exhibition.id},
          })
        ).flatMap(row => {
          const parsed = exhibitionArtworkRowSchema.safeParse(row)

          return parsed.success ? [parsed.data] : []
        })
        const worksById = new Map(
          (await readEntities(transaction, 'ARTWORK', validLocale)).map(work => [
            work.id,
            work,
          ]),
        )

        return immutableDetail({
          exhibition,
          works: Object.freeze(
            joins.flatMap(join => {
              const work = worksById.get(join.artworkId)

              return work ? [work] : []
            }),
          ),
        }) satisfies PublicExhibitionDetail
      })
    },
    async getHomepage(localeInput) {
      const validLocale = locale(localeInput)

      return await read(async transaction => {
        const works = await readEntities(transaction, 'ARTWORK', validLocale)
        const collections = await readEntities(
          transaction,
          'COLLECTION',
          validLocale,
        )
        const exhibitions = await readEntities(
          transaction,
          'EXHIBITION',
          validLocale,
        )
        const journalEntries = await readEntities(
          transaction,
          'JOURNAL_ENTRY',
          validLocale,
        )
        const pressEntries = await readEntities(
          transaction,
          'PRESS_ENTRY',
          validLocale,
        )

        return immutableDetail({
          collections: Object.freeze(
            collections.slice(0, HOMEPAGE_LIMITS.collections),
          ),
          exhibitions: Object.freeze(
            exhibitions.slice(0, HOMEPAGE_LIMITS.exhibitions),
          ),
          hero: works[0] ?? null,
          journalEntries: Object.freeze(
            journalEntries.slice(0, HOMEPAGE_LIMITS.journalEntries),
          ),
          pressEntries: Object.freeze(
            pressEntries.slice(0, HOMEPAGE_LIMITS.pressEntries),
          ),
          works: Object.freeze(works.slice(0, HOMEPAGE_LIMITS.works)),
        }) satisfies PublicHomepage
      })
    },
    async getJournalEntry(localeInput, slugInput) {
      const validLocale = locale(localeInput)
      const validSlug = slug(slugInput)

      return await read(async transaction =>
        (await readEntities(transaction, 'JOURNAL_ENTRY', validLocale)).find(
          item => item.slug === validSlug,
        ) ?? null,
      )
    },
    async getPage(localeInput, slugInput) {
      const validLocale = locale(localeInput)
      const validSlug = slug(slugInput)

      return await read(async transaction =>
        (await readEntities(transaction, 'PAGE', validLocale)).find(
          item => item.slug === validSlug,
        ) ?? null,
      )
    },
    async getPressEntry(localeInput, slugInput) {
      const validLocale = locale(localeInput)
      const validSlug = slug(slugInput)

      return await read(async transaction =>
        (await readEntities(transaction, 'PRESS_ENTRY', validLocale)).find(
          item => item.slug === validSlug,
        ) ?? null,
      )
    },
    async getWork(localeInput, slugInput) {
      const validLocale = locale(localeInput)
      const validSlug = slug(slugInput)

      return await read(async transaction =>
        (await readEntities(transaction, 'ARTWORK', validLocale)).find(
          item => item.slug === validSlug,
        ) ?? null,
      )
    },
    async listCollections(localeInput) {
      const validLocale = locale(localeInput)

      return await read(transaction =>
        readEntities(transaction, 'COLLECTION', validLocale),
      )
    },
    async listExhibitions(localeInput) {
      const validLocale = locale(localeInput)

      return await read(transaction =>
        readEntities(transaction, 'EXHIBITION', validLocale),
      )
    },
    async listJournalEntries(localeInput) {
      const validLocale = locale(localeInput)

      return await read(transaction =>
        readEntities(transaction, 'JOURNAL_ENTRY', validLocale),
      )
    },
    async listPressEntries(localeInput) {
      const validLocale = locale(localeInput)

      return await read(transaction =>
        readEntities(transaction, 'PRESS_ENTRY', validLocale),
      )
    },
    async listWorks(localeInput) {
      const validLocale = locale(localeInput)

      return await read(transaction =>
        readEntities(transaction, 'ARTWORK', validLocale),
      )
    },
  }

  return Object.freeze(reader)
}
