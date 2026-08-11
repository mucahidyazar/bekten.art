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
  ArtworkRecord,
  CollectionEdit,
  CollectionRecord,
  ExhibitionEdit,
  ExhibitionRecord,
  JournalEntryEdit,
  JournalEntryRecord,
  PageEdit,
  PageRecord,
  PressEntryEdit,
  PressEntryRecord,
} from './editorial-contracts'

interface EditorialContentRepository {
  readonly artworks: EditorialEntityRepository<ArtworkEdit, ArtworkRecord>
  readonly collections: EditorialEntityRepository<
    CollectionEdit,
    CollectionRecord
  >
  readonly exhibitions: EditorialEntityRepository<
    ExhibitionEdit,
    ExhibitionRecord
  >
  readonly journalEntries: EditorialEntityRepository<
    JournalEntryEdit,
    JournalEntryRecord
  >
  readonly pages: EditorialEntityRepository<PageEdit, PageRecord>
  readonly pressEntries: EditorialEntityRepository<
    PressEntryEdit,
    PressEntryRecord
  >
}

interface EditorialEntityRepository<TEdit, TRecord> {
  archive(
    id: string,
    expectedVersion: number,
    context: EditorialMutationContext,
  ): Promise<TRecord>
  create(value: TEdit, context: EditorialMutationContext): Promise<TRecord>
  findById(id: string): Promise<TRecord | null>
  findPublishedBySlug(
    query: EditorialIdentifierQuery,
  ): Promise<TRecord | null>
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
  z.output<typeof editorialIdentifierQuerySchema>
>

type EditorialListQuery = DeepReadonly<
  z.output<typeof editorialListQuerySchema>
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
