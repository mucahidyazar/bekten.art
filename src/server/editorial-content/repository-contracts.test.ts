import {describe, expect, expectTypeOf, it} from 'vitest'

import {
  editorialIdentifierQuerySchema,
  editorialListQuerySchema,
  type EditorialContentRepository,
  type EditorialEntityRepository,
  type EditorialMutationContext,
  type EditorialUpdateInput,
} from './editorial-repository'

import type {
  ArtworkEdit,
  ArtworkPublic,
  ArtworkRecord,
  CollectionEdit,
  ExhibitionEdit,
  JournalEntryEdit,
  PageEdit,
  PressEntryEdit,
} from './editorial-contracts'

describe('editorial repository contracts', () => {
  it('exposes a repository for every Studio-managed editorial aggregate', () => {
    expectTypeOf<EditorialContentRepository['artworks']>().toMatchTypeOf<
      EditorialEntityRepository<ArtworkEdit, ArtworkRecord, ArtworkPublic>
    >()
    expectTypeOf<EditorialContentRepository['collections']>().toMatchTypeOf<
      EditorialEntityRepository<CollectionEdit, unknown>
    >()
    expectTypeOf<EditorialContentRepository['exhibitions']>().toMatchTypeOf<
      EditorialEntityRepository<ExhibitionEdit, unknown>
    >()
    expectTypeOf<EditorialContentRepository['journalEntries']>().toMatchTypeOf<
      EditorialEntityRepository<JournalEntryEdit, unknown>
    >()
    expectTypeOf<EditorialContentRepository['pages']>().toMatchTypeOf<
      EditorialEntityRepository<PageEdit, unknown>
    >()
    expectTypeOf<EditorialContentRepository['pressEntries']>().toMatchTypeOf<
      EditorialEntityRepository<PressEntryEdit, unknown>
    >()
  })

  it('requires optimistic version and actor context for writes', () => {
    expectTypeOf<ArtworkEdit>().not.toHaveProperty('publishedAt')
    expectTypeOf<ArtworkEdit>().not.toHaveProperty('status')
    expectTypeOf<EditorialUpdateInput<ArtworkEdit>>().toEqualTypeOf<{
      readonly expectedVersion: number
      readonly value: ArtworkEdit
    }>()
    expectTypeOf<EditorialMutationContext>().toEqualTypeOf<{
      readonly actorUserId: string
      readonly requestId: string
    }>()
  })

  it('bounds and normalizes repository list queries', () => {
    expect(editorialListQuerySchema.parse({locale: 'ky'})).toEqual({
      limit: 24,
      locale: 'ky',
    })
    expect(() =>
      editorialListQuerySchema.parse({limit: 101, locale: 'en'}),
    ).toThrow()
  })

  it('validates locale and kebab-case identifiers at the repository boundary', () => {
    expect(
      editorialIdentifierQuerySchema.parse({
        locale: 'tr',
        slug: 'material-memory',
      }),
    ).toEqual({locale: 'tr', slug: 'material-memory'})
    expect(() =>
      editorialIdentifierQuerySchema.parse({
        locale: 'de',
        slug: 'Material Memory',
      }),
    ).toThrow()
  })
})
