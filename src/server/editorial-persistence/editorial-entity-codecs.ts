import {z} from 'zod'

import {
  artworkEditSchema,
  artworkPublicSchema,
  artworkRecordSchema,
  collectionEditSchema,
  collectionPublicSchema,
  collectionRecordSchema,
  contentMediaPlacementRecordSchema,
  exhibitionEditSchema,
  exhibitionPublicSchema,
  exhibitionRecordSchema,
  journalEntryEditSchema,
  journalEntryPublicSchema,
  journalEntryRecordSchema,
  pageEditSchema,
  pagePublicSchema,
  pageRecordSchema,
  pressEntryEditSchema,
  pressEntryPublicSchema,
  pressEntryRecordSchema,
} from '@/server/editorial-content'

import {
  editorialPublishingCodecs,
  parseEditorialAggregateSnapshot,
} from './editorial-codecs'

import type {EditorialEntityType, EditorialSnapshot} from '@/server/editorial-publishing/contracts'

export type EditorialEntityPersistenceCodec = Readonly<{
  data: (edit: unknown) => Readonly<Record<string, unknown>>
  delegate: string
  edit: (value: unknown) => Readonly<Record<string, unknown>>
  entityType: EditorialEntityType
  publicFromSnapshot: (
    snapshot: EditorialSnapshot,
    publishedAt: Date,
  ) => unknown
  record: (row: unknown, placements: readonly unknown[]) => unknown
}>

const rowSchema = z
  .object({
    createdAt: z.date(),
    id: z.string().uuid(),
    locale: z.enum(['en', 'tr', 'ru', 'ky']),
    publishedAt: z.date().nullable(),
    slug: z.string(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    updatedAt: z.date(),
    version: z.number().int().positive(),
  })
  .passthrough()

function commonData(edit: Readonly<Record<string, unknown>>) {
  const seo = z
    .object({
      canonicalPath: z.string(),
      description: z.string(),
      noIndex: z.boolean(),
      title: z.string(),
    })
    .parse(edit.seo)

  return {
    displayOrder: edit.displayOrder,
    locale: edit.locale,
    seoCanonicalPath: seo.canonicalPath,
    seoDescription: seo.description,
    seoNoIndex: seo.noIndex,
    seoTitle: seo.title,
    slug: edit.slug,
  }
}

function entityData(
  entityType: EditorialEntityType,
  edit: Readonly<Record<string, unknown>>,
) {
  const shared = commonData(edit)

  switch (entityType) {
    case 'ARTWORK':
      return {
        ...shared,
        availability: edit.availability,
        collectionId: edit.collectionId ?? null,
        description: edit.description,
        dimensions: edit.dimensions ?? null,
        medium: edit.medium ?? null,
        title: edit.title,
        year: edit.year ?? null,
      }
    case 'COLLECTION':
      return {...shared, description: edit.description, title: edit.title}
    case 'EXHIBITION':
      return {
        ...shared,
        body: edit.body,
        city: edit.city ?? null,
        country: edit.country ?? null,
        endsAt: edit.endsAt ?? null,
        startsAt: edit.startsAt,
        subtitle: edit.subtitle ?? null,
        title: edit.title,
        venue: edit.venue ?? null,
      }
    case 'JOURNAL_ENTRY':
      return {
        ...shared,
        body: edit.body,
        excerpt: edit.excerpt,
        title: edit.title,
      }
    case 'PAGE':
      return {
        ...shared,
        body: edit.body,
        eyebrow: edit.eyebrow ?? null,
        title: edit.title,
      }
    case 'PRESS_ENTRY':
      return {
        ...shared,
        category: edit.pressCategory,
        content: edit.body ?? null,
        description: edit.excerpt,
        outlet: edit.outlet,
        publishedOn: edit.publishedOn ?? null,
        sourceUrl: edit.sourceUrl,
        subtitle: edit.subtitle ?? null,
        title: edit.title,
      }
  }
}

function codec(
  entityType: EditorialEntityType,
  editSchema: z.ZodType,
  recordSchema: z.ZodType,
  publicSchema: z.ZodType,
): EditorialEntityPersistenceCodec {
  const publishingCodec = editorialPublishingCodecs[entityType]

  function parseEdit(value: unknown) {
    return editSchema.parse(value) as Readonly<Record<string, unknown>>
  }

  return Object.freeze({
    data(value: unknown) {
      return entityData(entityType, parseEdit(value))
    },
    delegate: publishingCodec.delegate,
    edit: parseEdit,
    entityType,
    publicFromSnapshot(snapshot: EditorialSnapshot, publishedAt: Date) {
      const parsed = parseEditorialAggregateSnapshot({
        entityId: '00000000-0000-4000-8000-000000000000',
        entityType,
        locale: z.enum(['en', 'tr', 'ru', 'ky']).parse(snapshot.locale),
        slug: z.string().parse(snapshot.slug),
        snapshot,
      })
      const publicInput = Object.fromEntries(
        Object.entries(parsed as Readonly<Record<string, unknown>>).filter(
          ([key]) => key !== 'displayOrder',
        ),
      )

      return publicSchema.parse({...publicInput, publishedAt})
    },
    record(rowInput: unknown, placementRows: readonly unknown[]) {
      const row = rowSchema.parse(rowInput)
      const snapshot = publishingCodec.draftSnapshot(row, placementRows)
      const edit = parseEditorialAggregateSnapshot({
        entityId: row.id,
        entityType,
        locale: row.locale,
        slug: row.slug,
        snapshot,
      })

      return recordSchema.parse({
        ...edit,
        createdAt: row.createdAt,
        id: row.id,
        mediaPlacements: placementRows.map(placement =>
          contentMediaPlacementRecordSchema.parse(placement),
        ),
        publishedAt: row.publishedAt,
        status: row.status,
        updatedAt: row.updatedAt,
        version: row.version,
      })
    },
  })
}

export const editorialEntityCodecs = Object.freeze({
  ARTWORK: codec(
    'ARTWORK',
    artworkEditSchema,
    artworkRecordSchema,
    artworkPublicSchema,
  ),
  COLLECTION: codec(
    'COLLECTION',
    collectionEditSchema,
    collectionRecordSchema,
    collectionPublicSchema,
  ),
  EXHIBITION: codec(
    'EXHIBITION',
    exhibitionEditSchema,
    exhibitionRecordSchema,
    exhibitionPublicSchema,
  ),
  JOURNAL_ENTRY: codec(
    'JOURNAL_ENTRY',
    journalEntryEditSchema,
    journalEntryRecordSchema,
    journalEntryPublicSchema,
  ),
  PAGE: codec('PAGE', pageEditSchema, pageRecordSchema, pagePublicSchema),
  PRESS_ENTRY: codec(
    'PRESS_ENTRY',
    pressEntryEditSchema,
    pressEntryRecordSchema,
    pressEntryPublicSchema,
  ),
}) satisfies Readonly<
  Record<EditorialEntityType, EditorialEntityPersistenceCodec>
>
