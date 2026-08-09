import {z} from 'zod'

import {
  artistStatCreateSchema,
  artistStatRowSchema,
  artworkCreateSchema,
  artworkRowSchema,
  contentLocaleSchema,
  memoryCreateSchema,
  memoryRowSchema,
  newsArticleCreateSchema,
  newsArticleRowSchema,
  pressItemCreateSchema,
  pressItemRowSchema,
  testimonialCreateSchema,
  testimonialRowSchema,
  uuidSchema,
  workshopItemCreateSchema,
  workshopItemRowSchema,
} from './domain'

import type {
  ContentRepository,
  PublishedContentRepository,
  PublishedIdentifierQuery,
  PublishedListQuery,
} from './content-repository'

type Delegate = {
  create(args: {data: unknown}): Promise<unknown>
  findFirst(args: unknown): Promise<unknown | null>
  findMany(args: unknown): Promise<unknown[]>
  findUnique(args: {where: {id: string}}): Promise<unknown | null>
  update(args: {data: unknown; where: {id: string}}): Promise<unknown>
}

export type ContentDatabase = Partial<{
  artistStat: Delegate
  artwork: Delegate
  memory: Delegate
  newsArticle: Delegate
  pressItem: Delegate
  testimonial: Delegate
  workshopItem: Delegate
}>

const listQuerySchema = z
  .object({
    before: z.date().default(() => new Date()),
    limit: z.number().int().min(1).max(100).default(50),
    locale: contentLocaleSchema,
  })
  .strict()

const identifierQuerySchema = listQuerySchema
  .omit({limit: true})
  .extend({identifier: z.string().trim().min(1).max(160)})
  .strict()

function requiredDelegate(delegate: Delegate | undefined, modelName: string) {
  if (!delegate) {
    throw new Error(`${modelName} database delegate is not configured`)
  }

  return delegate
}

function parsePartialObject<TCreate>(
  schema: z.ZodType<TCreate>,
  input: Partial<TCreate>,
): Partial<TCreate> {
  const record = z.record(z.string(), z.unknown()).parse(input)
  const shape = (schema as unknown as z.ZodObject<z.ZodRawShape>).shape
  const parsedEntries = Object.entries(record).map(([key, value]) => {
    const fieldSchema = shape[key] as unknown as z.ZodType<unknown> | undefined

    if (!fieldSchema) {
      throw new Error(`Unknown update field: ${key}`)
    }

    return [key, fieldSchema.parse(value)] as const
  })

  return Object.fromEntries(parsedEntries) as Partial<TCreate>
}

function createPublishedRepository<TCreate, TRow>({
  createSchema,
  delegate,
  modelName,
  rowSchema,
  slugField,
}: {
  createSchema: z.ZodType<TCreate>
  delegate: Delegate | undefined
  modelName: string
  rowSchema: z.ZodType<TRow>
  slugField?: string
}): PublishedContentRepository<TCreate, TRow> {
  return Object.freeze({
    async archive(id: string) {
      const parsedId = uuidSchema.parse(id)
      const row = await requiredDelegate(delegate, modelName).update({
        data: {publishedAt: null, status: 'ARCHIVED'},
        where: {id: parsedId},
      })

      return rowSchema.parse(row)
    },
    async create(input: TCreate) {
      const data = createSchema.parse(input)
      const row = await requiredDelegate(delegate, modelName).create({data})

      return rowSchema.parse(row)
    },
    async findById(id: string) {
      const parsedId = uuidSchema.parse(id)
      const row = await requiredDelegate(delegate, modelName).findUnique({
        where: {id: parsedId},
      })

      return row === null ? null : rowSchema.parse(row)
    },
    async findPublishedByIdentifier(query: PublishedIdentifierQuery) {
      const parsed = identifierQuerySchema.parse(query)
      const parsedId = uuidSchema.safeParse(parsed.identifier)
      const identifiers = [
        ...(parsedId.success ? [{id: parsedId.data}] : []),
        ...(slugField ? [{[slugField]: parsed.identifier}] : []),
      ]

      if (identifiers.length === 0) {
        return null
      }

      const row = await requiredDelegate(delegate, modelName).findFirst({
        where: {
          locale: parsed.locale,
          OR: identifiers,
          publishedAt: {lte: parsed.before},
          status: 'PUBLISHED',
        },
      })

      return row === null ? null : rowSchema.parse(row)
    },
    async listPublished(query: PublishedListQuery) {
      const parsed = listQuerySchema.parse(query)
      const rows = await requiredDelegate(delegate, modelName).findMany({
        orderBy: [{displayOrder: 'asc'}, {publishedAt: 'desc'}],
        take: parsed.limit,
        where: {
          locale: parsed.locale,
          publishedAt: {lte: parsed.before},
          status: 'PUBLISHED',
        },
      })

      return rows.map(row => rowSchema.parse(row))
    },
    async update(id: string, input: Partial<TCreate>) {
      const parsedId = uuidSchema.parse(id)
      const data = parsePartialObject(createSchema, input)

      if (Object.keys(data).length === 0) {
        throw new Error('At least one field is required for update')
      }

      const row = await requiredDelegate(delegate, modelName).update({
        data,
        where: {id: parsedId},
      })

      return rowSchema.parse(row)
    },
  })
}

export function createDatabaseContentRepository(
  database: ContentDatabase,
): ContentRepository {
  return Object.freeze({
    artistStats: createPublishedRepository({
      createSchema: artistStatCreateSchema,
      delegate: database.artistStat,
      modelName: 'ArtistStat',
      rowSchema: artistStatRowSchema,
    }),
    artworks: createPublishedRepository({
      createSchema: artworkCreateSchema,
      delegate: database.artwork,
      modelName: 'Artwork',
      rowSchema: artworkRowSchema,
      slugField: 'slug',
    }),
    memories: createPublishedRepository({
      createSchema: memoryCreateSchema,
      delegate: database.memory,
      modelName: 'Memory',
      rowSchema: memoryRowSchema,
      slugField: 'slug',
    }),
    newsArticles: createPublishedRepository({
      createSchema: newsArticleCreateSchema,
      delegate: database.newsArticle,
      modelName: 'NewsArticle',
      rowSchema: newsArticleRowSchema,
      slugField: 'slug',
    }),
    pressItems: createPublishedRepository({
      createSchema: pressItemCreateSchema,
      delegate: database.pressItem,
      modelName: 'PressItem',
      rowSchema: pressItemRowSchema,
    }),
    testimonials: createPublishedRepository({
      createSchema: testimonialCreateSchema,
      delegate: database.testimonial,
      modelName: 'Testimonial',
      rowSchema: testimonialRowSchema,
    }),
    workshopItems: createPublishedRepository({
      createSchema: workshopItemCreateSchema,
      delegate: database.workshopItem,
      modelName: 'WorkshopItem',
      rowSchema: workshopItemRowSchema,
      slugField: 'slug',
    }),
  })
}
