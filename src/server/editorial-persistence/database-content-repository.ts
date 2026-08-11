import {z} from 'zod'

import {
  editorialIdentifierQuerySchema,
  editorialListQuerySchema,
  uuidSchema,
} from '@/server/editorial-content'
import {
  EditorialContentNotFoundError,
  EditorialVersionConflictError,
  toImmutableEditorialSnapshot,
} from '@/server/editorial-publishing'

import type {EditorialEntityPersistenceCodec} from './editorial-entity-codecs'
import type {
  EditorialContentRepository,
  EditorialMutationContext,
  EditorialReorderItem,
} from '@/server/editorial-content'
import type {EditorialEntityType} from '@/server/editorial-publishing'

type EntityDelegate = Readonly<{
  create: (args: unknown) => Promise<unknown>
  findFirst: (args: unknown) => Promise<unknown | null>
  findMany: (args: unknown) => Promise<readonly unknown[]>
  findUnique: (args: unknown) => Promise<unknown | null>
  updateMany: (args: unknown) => Promise<Readonly<{count: number}>>
}>

type ContentTransaction = Readonly<{
  [delegate: string]: unknown
  auditEvent: Readonly<{create: (args: unknown) => Promise<unknown>}>
  contentMediaPlacement: Readonly<{
    createMany: (args: unknown) => Promise<Readonly<{count: number}>>
    deleteMany: (args: unknown) => Promise<Readonly<{count: number}>>
    findMany: (args: unknown) => Promise<readonly unknown[]>
  }>
  contentRevision: Readonly<{
    findFirst: (args: unknown) => Promise<unknown | null>
  }>
  mediaObject: Readonly<{
    findMany: (args: unknown) => Promise<readonly unknown[]>
  }>
}>

export type EditorialContentDatabase = Readonly<{
  $transaction: <Result>(
    callback: (transaction: ContentTransaction) => Promise<Result>,
  ) => Promise<Result>
}>

export type EditorialContentEntityCodecs = Readonly<
  Record<EditorialEntityType, EditorialEntityPersistenceCodec>
>

const contextSchema = z.object({
  actorUserId: uuidSchema,
  requestId: z.string().trim().min(1).max(160),
})
const updateSchema = z.object({
  expectedVersion: z.number().int().positive(),
  value: z.unknown(),
})
const reorderSchema = z
  .array(
    z.object({
      displayOrder: z.number().int().min(0).max(1_000_000),
      expectedVersion: z.number().int().positive(),
      id: uuidSchema,
    }),
  )
  .min(1)
  .max(100)
  .superRefine((items, refinement) => {
    if (new Set(items.map(({id}) => id)).size !== items.length) {
      refinement.addIssue({code: 'custom', message: 'Duplicate entity id'})
    }

    if (
      new Set(items.map(({displayOrder}) => displayOrder)).size !== items.length
    ) {
      refinement.addIssue({code: 'custom', message: 'Duplicate display order'})
    }
  })
const lifecycleRowSchema = z
  .object({
    id: uuidSchema,
    publishedAt: z.date().nullable(),
    version: z.number().int().positive(),
  })
  .passthrough()
const revisionSnapshotSchema = z.object({snapshot: z.unknown()}).passthrough()

function entityDelegate(transaction: ContentTransaction, name: string) {
  const selected = transaction[name] as Partial<EntityDelegate> | undefined

  if (
    !selected ||
    typeof selected.create !== 'function' ||
    typeof selected.findFirst !== 'function' ||
    typeof selected.findMany !== 'function' ||
    typeof selected.findUnique !== 'function' ||
    typeof selected.updateMany !== 'function'
  ) {
    throw new Error('EDITORIAL_PERSISTENCE_CONFIGURATION_INVALID')
  }

  return selected as EntityDelegate
}

function placementData(
  entityId: string,
  entityType: EditorialEntityType,
  edit: Readonly<Record<string, unknown>>,
) {
  const placements = z
    .array(z.record(z.string(), z.unknown()))
    .parse(edit.mediaPlacements)

  return placements.map(placement => ({
    altText: placement.altText,
    caption: placement.caption ?? null,
    credit: placement.credit ?? null,
    crop: placement.crop,
    displayOrder: placement.displayOrder,
    entityId,
    entityType,
    focalPoint: placement.focalPoint ?? null,
    mediaObjectId: placement.mediaObjectId,
    role: placement.role,
  }))
}

async function audit(
  transaction: ContentTransaction,
  action: string,
  entityType: EditorialEntityType,
  entityId: string,
  context: EditorialMutationContext,
  metadata: Readonly<Record<string, unknown>> = {},
) {
  await transaction.auditEvent.create({
    data: {
      action,
      actorUserId: context.actorUserId,
      entityId,
      entityType,
      metadata: {...metadata},
      requestId: context.requestId,
    },
  })
}

export function createDatabaseEditorialContentRepository(
  database: EditorialContentDatabase,
  codecs: EditorialContentEntityCodecs,
  dependencies: Readonly<{now?: () => Date}> = {},
): EditorialContentRepository {
  const now = dependencies.now ?? (() => new Date())

  function repository(entityType: EditorialEntityType) {
    const codec = codecs[entityType]

    async function record(transaction: ContentTransaction, row: unknown) {
      const lifecycle = lifecycleRowSchema.safeParse(row)

      if (!lifecycle.success) {
        throw new Error('EDITORIAL_PERSISTENCE_ROW_INVALID')
      }

      const placements = await transaction.contentMediaPlacement.findMany({
        orderBy: {displayOrder: 'asc'},
        where: {entityId: lifecycle.data.id, entityType},
      })

      return codec.record(row, placements)
    }

    async function versionConflict(
      delegate: EntityDelegate,
      id: string,
      expectedVersion: number,
    ): Promise<never> {
      const current = lifecycleRowSchema.safeParse(
        await delegate.findUnique({where: {id}}),
      )

      if (!current.success) throw new EditorialContentNotFoundError()

      throw new EditorialVersionConflictError(
        expectedVersion,
        current.data.version,
      )
    }

    async function replacePlacements(
      transaction: ContentTransaction,
      entityId: string,
      edit: Readonly<Record<string, unknown>>,
      removeExisting: boolean,
    ) {
      const data = placementData(entityId, entityType, edit)
      const mediaObjectIds = [
        ...new Set(
          data.map(({mediaObjectId}) => uuidSchema.parse(mediaObjectId)),
        ),
      ]

      if (mediaObjectIds.length > 0) {
        const availableMedia = z.array(z.object({id: uuidSchema})).parse(
          await transaction.mediaObject.findMany({
            select: {id: true},
            where: {
              id: {in: mediaObjectIds},
              provider: 'garage',
              status: 'READY',
              visibility: 'PUBLIC',
            },
          }),
        )
        const availableIds = new Set(availableMedia.map(({id}) => id))

        if (mediaObjectIds.some(id => !availableIds.has(id))) {
          throw new Error('EDITORIAL_MEDIA_UNAVAILABLE')
        }
      }

      if (removeExisting) {
        await transaction.contentMediaPlacement.deleteMany({
          where: {entityId, entityType},
        })
      }

      if (data.length > 0) {
        await transaction.contentMediaPlacement.createMany({data})
      }
    }

    return Object.freeze({
      archive(
        idInput: string,
        expectedVersionInput: number,
        contextInput: EditorialMutationContext,
      ) {
        const id = uuidSchema.parse(idInput)
        const expectedVersion = z
          .number()
          .int()
          .positive()
          .parse(expectedVersionInput)
        const context = contextSchema.parse(contextInput)

        return database.$transaction(async transaction => {
          const delegate = entityDelegate(transaction, codec.delegate)
          const result = await delegate.updateMany({
            data: {
              publishedAt: null,
              status: 'ARCHIVED',
              version: expectedVersion + 1,
            },
            where: {id, version: expectedVersion},
          })

          if (result.count !== 1) {
            return versionConflict(delegate, id, expectedVersion)
          }

          await audit(
            transaction,
            'editorial.archived',
            entityType,
            id,
            context,
            {
              fromVersion: expectedVersion,
              toVersion: expectedVersion + 1,
            },
          )
          const updated = await delegate.findUnique({where: {id}})

          return record(transaction, updated)
        })
      },
      create(value: unknown, contextInput: EditorialMutationContext) {
        const edit = codec.edit(value)
        const context = contextSchema.parse(contextInput)

        return database.$transaction(async transaction => {
          const created = await entityDelegate(
            transaction,
            codec.delegate,
          ).create({
            data: {...codec.data(edit), status: 'DRAFT', version: 1},
          })
          const parsed = lifecycleRowSchema.parse(created)

          await replacePlacements(transaction, parsed.id, edit, false)
          await audit(
            transaction,
            'editorial.created',
            entityType,
            parsed.id,
            context,
            {version: 1},
          )

          return record(transaction, created)
        })
      },
      findById(idInput: string) {
        const id = uuidSchema.parse(idInput)

        return database.$transaction(async transaction => {
          const found = await entityDelegate(
            transaction,
            codec.delegate,
          ).findUnique({where: {id}})

          return found ? record(transaction, found) : null
        })
      },
      findPublishedBySlug(queryInput: unknown) {
        const query = editorialIdentifierQuerySchema.parse(queryInput)
        const selectedAt = query.before ?? now()

        return database.$transaction(async transaction => {
          const row = await entityDelegate(
            transaction,
            codec.delegate,
          ).findFirst({
            where: {
              locale: query.locale,
              publishedAt: {lte: selectedAt},
              slug: query.slug,
              status: 'PUBLISHED',
            },
          })

          if (!row) return null

          const lifecycle = lifecycleRowSchema.safeParse(row)

          if (!lifecycle.success || !lifecycle.data.publishedAt) {
            throw new Error('EDITORIAL_PERSISTENCE_ROW_INVALID')
          }

          const revision = revisionSnapshotSchema.safeParse(
            await transaction.contentRevision.findFirst({
              orderBy: {version: 'desc'},
              where: {entityId: lifecycle.data.id, entityType},
            }),
          )

          if (!revision.success) return null

          return codec.publicFromSnapshot(
            toImmutableEditorialSnapshot(revision.data.snapshot),
            lifecycle.data.publishedAt,
          )
        })
      },
      list(queryInput: unknown) {
        const query = editorialListQuerySchema.parse(queryInput)

        return database.$transaction(async transaction => {
          const where = {
            locale: query.locale,
            ...(query.status ? {status: query.status} : {}),
            ...(query.before ? {updatedAt: {lt: query.before}} : {}),
          }
          const rows = await entityDelegate(
            transaction,
            codec.delegate,
          ).findMany({
            ...(query.cursor ? {cursor: {id: query.cursor}, skip: 1} : {}),
            orderBy: [{displayOrder: 'asc'}, {id: 'asc'}],
            take: query.limit,
            where,
          })
          const lifecycles = rows.map(row => lifecycleRowSchema.parse(row))

          if (lifecycles.length === 0) return []

          const placements = await transaction.contentMediaPlacement.findMany({
            orderBy: {displayOrder: 'asc'},
            where: {
              entityId: {in: lifecycles.map(({id}) => id)},
              entityType,
            },
          })

          return rows.map((row, index) =>
            codec.record(
              row,
              placements.filter(
                placement =>
                  z.object({entityId: uuidSchema}).parse(placement).entityId ===
                  lifecycles[index].id,
              ),
            ),
          )
        })
      },
      reorder(
        input: readonly EditorialReorderItem[],
        contextInput: EditorialMutationContext,
      ) {
        const items = reorderSchema.parse(input)
        const context = contextSchema.parse(contextInput)

        return database.$transaction(async transaction => {
          const delegate = entityDelegate(transaction, codec.delegate)

          for (const item of items) {
            const result = await delegate.updateMany({
              data: {
                displayOrder: item.displayOrder,
                version: item.expectedVersion + 1,
              },
              where: {id: item.id, version: item.expectedVersion},
            })

            if (result.count !== 1) {
              return versionConflict(delegate, item.id, item.expectedVersion)
            }
          }

          await audit(
            transaction,
            'editorial.reordered',
            entityType,
            items[0]?.id ?? 'batch',
            context,
            {count: items.length},
          )
          const rows = await delegate.findMany({
            orderBy: [{displayOrder: 'asc'}, {id: 'asc'}],
            where: {id: {in: items.map(({id}) => id)}},
          })

          return Promise.all(rows.map(row => record(transaction, row)))
        })
      },
      update(
        idInput: string,
        inputValue: unknown,
        contextInput: EditorialMutationContext,
      ) {
        const id = uuidSchema.parse(idInput)
        const input = updateSchema.parse(inputValue)
        const edit = codec.edit(input.value)
        const context = contextSchema.parse(contextInput)

        return database.$transaction(async transaction => {
          const delegate = entityDelegate(transaction, codec.delegate)
          const result = await delegate.updateMany({
            data: {...codec.data(edit), version: input.expectedVersion + 1},
            where: {id, version: input.expectedVersion},
          })

          if (result.count !== 1) {
            return versionConflict(delegate, id, input.expectedVersion)
          }

          await replacePlacements(transaction, id, edit, true)
          await audit(
            transaction,
            'editorial.updated',
            entityType,
            id,
            context,
            {
              fromVersion: input.expectedVersion,
              toVersion: input.expectedVersion + 1,
            },
          )
          const updated = await delegate.findUnique({where: {id}})

          return record(transaction, updated)
        })
      },
    })
  }

  return Object.freeze({
    artworks: repository('ARTWORK'),
    collections: repository('COLLECTION'),
    exhibitions: repository('EXHIBITION'),
    journalEntries: repository('JOURNAL_ENTRY'),
    pages: repository('PAGE'),
    pressEntries: repository('PRESS_ENTRY'),
  }) as unknown as EditorialContentRepository
}
