import {z} from 'zod'

import {
  artworkEditSchema,
  collectionEditSchema,
  contentMediaPlacementEditSchema,
  exhibitionEditSchema,
  journalEntryEditSchema,
  pageEditSchema,
  pressEntryEditSchema,
  uuidSchema,
} from '@/server/editorial-content'
import {toImmutableEditorialSnapshot} from '@/server/editorial-publishing/snapshot'

import type {
  EditorialPublishingEntityCodec,
  EditorialPublishingEntityCodecs,
} from './database-publishing-repository'
import type {
  EditorialAggregateValidationInput,
  EditorialEntityType,
  EditorialJsonValue,
  EditorialSnapshot,
} from '@/server/editorial-publishing/contracts'

type Row = Readonly<Record<string, unknown>>

const schemas = {
  ARTWORK: artworkEditSchema,
  COLLECTION: collectionEditSchema,
  EXHIBITION: exhibitionEditSchema,
  JOURNAL_ENTRY: journalEntryEditSchema,
  PAGE: pageEditSchema,
  PRESS_ENTRY: pressEntryEditSchema,
} satisfies Record<EditorialEntityType, z.ZodType>

function mediaPlacements(rows: readonly unknown[]) {
  return rows.map(row => {
    const source = z.record(z.string(), z.unknown()).parse(row)

    return contentMediaPlacementEditSchema.parse({
      altText: source.altText,
      caption: source.caption,
      credit: source.credit,
      crop: source.crop,
      displayOrder: source.displayOrder,
      focalPoint: source.focalPoint,
      mediaObjectId: source.mediaObjectId,
      role: source.role,
    })
  })
}

function editBase(row: Row, placements: readonly unknown[]) {
  return {
    displayOrder: row.displayOrder,
    locale: row.locale,
    mediaPlacements: mediaPlacements(placements),
    seo: {
      canonicalPath: row.seoCanonicalPath,
      description: row.seoDescription,
      noIndex: row.seoNoIndex,
      title: row.seoTitle,
    },
    slug: row.slug,
  }
}

function jsonValue(value: unknown): EditorialJsonValue {
  if (value instanceof Date) return value.toISOString()

  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return value
  }

  if (Array.isArray(value)) {
    return Object.freeze(value.map(item => jsonValue(item)))
  }

  if (typeof value !== 'object') {
    throw new Error('EDITORIAL_SNAPSHOT_SERIALIZATION_INVALID')
  }

  return Object.freeze(
    Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, jsonValue(item)]),
    ),
  )
}

function jsonSnapshot(value: unknown) {
  return toImmutableEditorialSnapshot(jsonValue(value))
}

function codec(
  delegate: string,
  schema: z.ZodType,
  project: (row: Row) => Readonly<Record<string, unknown>>,
): EditorialPublishingEntityCodec {
  return Object.freeze({
    delegate,
    draftSnapshot(row: Row, placements: readonly unknown[]) {
      return jsonSnapshot(
        schema.parse({...editBase(row, placements), ...project(row)}),
      )
    },
  })
}

export const editorialPublishingCodecs = Object.freeze({
  ARTWORK: codec('artwork', artworkEditSchema, row => ({
    availability: row.availability,
    collectionId: row.collectionId ?? null,
    description: row.description,
    dimensions: row.dimensions ?? null,
    medium: row.medium ?? null,
    title: row.title,
    year: row.year ?? null,
  })),
  COLLECTION: codec('collection', collectionEditSchema, row => ({
    description: row.description,
    title: row.title,
  })),
  EXHIBITION: codec('exhibition', exhibitionEditSchema, row => ({
    body: row.body,
    city: row.city ?? null,
    country: row.country ?? null,
    endsAt: row.endsAt ?? null,
    startsAt: row.startsAt,
    subtitle: row.subtitle ?? null,
    title: row.title,
    venue: row.venue ?? null,
  })),
  JOURNAL_ENTRY: codec('journalEntry', journalEntryEditSchema, row => ({
    body: row.body,
    excerpt: row.excerpt,
    title: row.title,
  })),
  PAGE: codec('page', pageEditSchema, row => ({
    body: row.body,
    eyebrow: row.eyebrow ?? null,
    title: row.title,
  })),
  PRESS_ENTRY: codec('pressItem', pressEntryEditSchema, row => ({
    body: row.content ?? null,
    excerpt: row.description,
    outlet: row.outlet,
    pressCategory: row.category,
    publishedOn: row.publishedOn ?? null,
    sourceUrl: row.sourceUrl,
    subtitle: row.subtitle ?? null,
    title: row.title,
  })),
}) satisfies Readonly<
  Record<EditorialEntityType, EditorialPublishingEntityCodec>
> &
  EditorialPublishingEntityCodecs

function snapshotInput(
  entityType: EditorialEntityType,
  snapshot: EditorialSnapshot,
) {
  if (entityType === 'EXHIBITION') {
    return {
      ...snapshot,
      endsAt:
        typeof snapshot.endsAt === 'string'
          ? new Date(snapshot.endsAt)
          : snapshot.endsAt,
      startsAt:
        typeof snapshot.startsAt === 'string'
          ? new Date(snapshot.startsAt)
          : snapshot.startsAt,
    }
  }

  if (entityType === 'PRESS_ENTRY') {
    return {
      ...snapshot,
      publishedOn:
        typeof snapshot.publishedOn === 'string'
          ? new Date(snapshot.publishedOn)
          : snapshot.publishedOn,
    }
  }

  return snapshot
}

export function parseEditorialAggregateSnapshot(
  input: EditorialAggregateValidationInput,
) {
  uuidSchema.parse(input.entityId)
  const schema = schemas[input.entityType]
  const parsed = schema.parse(snapshotInput(input.entityType, input.snapshot)) as {
    locale: string
    slug: string
  }

  if (parsed.locale !== input.locale || parsed.slug !== input.slug) {
    throw new Error('EDITORIAL_SNAPSHOT_IDENTITY_MISMATCH')
  }

  return parsed
}

export function validateEditorialAggregateSnapshot(
  input: EditorialAggregateValidationInput,
): EditorialSnapshot {
  return jsonSnapshot(parseEditorialAggregateSnapshot(input))
}
