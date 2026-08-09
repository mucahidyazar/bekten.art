import type {
  artistStatCreateSchema,
  artistStatRowSchema,
  artworkCreateSchema,
  artworkRowSchema,
  memoryCreateSchema,
  memoryRowSchema,
  newsArticleCreateSchema,
  newsArticleRowSchema,
  pressItemCreateSchema,
  pressItemRowSchema,
  testimonialCreateSchema,
  testimonialRowSchema,
  workshopItemCreateSchema,
  workshopItemRowSchema,
} from './domain'
import type {z} from 'zod'

export interface ContentRepository {
  artistStats: PublishedContentRepository<
    z.input<typeof artistStatCreateSchema>,
    z.output<typeof artistStatRowSchema>
  >
  artworks: PublishedContentRepository<
    z.input<typeof artworkCreateSchema>,
    z.output<typeof artworkRowSchema>
  >
  memories: PublishedContentRepository<
    z.input<typeof memoryCreateSchema>,
    z.output<typeof memoryRowSchema>
  >
  newsArticles: PublishedContentRepository<
    z.input<typeof newsArticleCreateSchema>,
    z.output<typeof newsArticleRowSchema>
  >
  pressItems: PublishedContentRepository<
    z.input<typeof pressItemCreateSchema>,
    z.output<typeof pressItemRowSchema>
  >
  testimonials: PublishedContentRepository<
    z.input<typeof testimonialCreateSchema>,
    z.output<typeof testimonialRowSchema>
  >
  workshopItems: PublishedContentRepository<
    z.input<typeof workshopItemCreateSchema>,
    z.output<typeof workshopItemRowSchema>
  >
}

export interface PublishedContentRepository<TCreate, TRow> {
  archive(id: string): Promise<TRow>
  create(input: TCreate): Promise<TRow>
  findById(id: string): Promise<TRow | null>
  findPublishedByIdentifier(
    query: PublishedIdentifierQuery,
  ): Promise<TRow | null>
  listPublished(query: PublishedListQuery): Promise<TRow[]>
  update(id: string, input: Partial<TCreate>): Promise<TRow>
}

export type PublishedIdentifierQuery = {
  before?: Date
  identifier: string
  locale: 'en' | 'tr' | 'ru' | 'ky'
}

export type PublishedListQuery = {
  before?: Date
  limit?: number
  locale: 'en' | 'tr' | 'ru' | 'ky'
}
