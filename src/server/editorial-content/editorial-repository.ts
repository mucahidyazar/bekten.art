import {z} from 'zod'

import {
  editorialLocaleSchema,
  editorialStatusSchema,
  kebabSlugSchema,
  uuidSchema,
} from './common-contracts'

import type {DeepReadonly} from './common-contracts'
import type {
  ArtworkEdit,
  ArtworkPublic,
  ArtworkRecord,
  CollectionEdit,
  CollectionPublic,
  CollectionRecord,
  ExhibitionEdit,
  ExhibitionPublic,
  ExhibitionRecord,
  JournalEntryEdit,
  JournalEntryPublic,
  JournalEntryRecord,
  PageEdit,
  PagePublic,
  PageRecord,
  PressEntryEdit,
  PressEntryPublic,
  PressEntryRecord,
} from './editorial-contracts'

interface EditorialContentRepository {
  readonly artworks: EditorialEntityRepository<
    ArtworkEdit,
    ArtworkRecord,
    ArtworkPublic
  >
  readonly collections: EditorialEntityRepository<
    CollectionEdit,
    CollectionRecord,
    CollectionPublic
  >
  readonly exhibitions: EditorialEntityRepository<
    ExhibitionEdit,
    ExhibitionRecord,
    ExhibitionPublic
  >
  readonly journalEntries: EditorialEntityRepository<
    JournalEntryEdit,
    JournalEntryRecord,
    JournalEntryPublic
  >
  readonly pages: EditorialEntityRepository<PageEdit, PageRecord, PagePublic>
  readonly pressEntries: EditorialEntityRepository<
    PressEntryEdit,
    PressEntryRecord,
    PressEntryPublic
  >
}

interface EditorialEntityRepository<TEdit, TRecord, TPublic = TRecord> {
  archive(
    id: string,
    expectedVersion: number,
    context: EditorialMutationContext,
  ): Promise<TRecord>
  create(value: TEdit, context: EditorialMutationContext): Promise<TRecord>
  findById(id: string): Promise<TRecord | null>
  findPublishedBySlug(
    query: EditorialIdentifierQuery,
  ): Promise<TPublic | null>
  list(query: EditorialListQuery): Promise<readonly TRecord[]>
  reorder(
    input: readonly EditorialReorderItem[],
    context: EditorialMutationContext,
  ): Promise<readonly TRecord[]>
  update(
    id: string,
    input: EditorialUpdateInput<TEdit>,
    context: EditorialMutationContext,
  ): Promise<TRecord>
}

type EditorialIdentifierQuery = DeepReadonly<
  z.input<typeof editorialIdentifierQuerySchema>
>

type EditorialListQuery = DeepReadonly<
  z.input<typeof editorialListQuerySchema>
>

type EditorialMutationContext = {
  readonly actorUserId: string
  readonly requestId: string
}

type EditorialReorderItem = {
  readonly displayOrder: number
  readonly expectedVersion: number
  readonly id: string
}

type EditorialUpdateInput<TEdit> = {
  readonly expectedVersion: number
  readonly value: TEdit
}

const editorialIdentifierQuerySchema = z
  .object({
    before: z.date().optional(),
    locale: editorialLocaleSchema,
    slug: kebabSlugSchema,
  })
  .strict()

const editorialListQuerySchema = z
  .object({
    before: z.date().optional(),
    cursor: uuidSchema.optional(),
    limit: z.number().int().min(1).max(100).default(24),
    locale: editorialLocaleSchema,
    status: editorialStatusSchema.optional(),
  })
  .strict()

export {
  type EditorialContentRepository,
  type EditorialEntityRepository,
  type EditorialIdentifierQuery,
  type EditorialListQuery,
  type EditorialMutationContext,
  type EditorialReorderItem,
  type EditorialUpdateInput,
  editorialIdentifierQuerySchema,
  editorialListQuerySchema,
}
