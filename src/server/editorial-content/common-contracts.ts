import {z} from 'zod'

import {contentMediaPlacementEditSchema} from './media-placement'

const editorialLocaleSchema = z.enum(['en', 'tr', 'ru', 'ky'])
const editorialStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])

const kebabSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase kebab-case slug')

const uuidSchema = z.string().uuid()

const httpsUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine(value => new URL(value).protocol === 'https:', 'URL must use HTTPS')

const canonicalPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .regex(
    /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9]+(?:-[a-z0-9]+)*\/?$|^\/$/,
    'Use a local path with kebab-case segments',
  )

const nullableText = (maximum: number) =>
  z.string().trim().max(maximum).nullable().optional()

const requiredText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum)

const editorialSeoSchema = z
  .object({
    canonicalPath: canonicalPathSchema,
    description: requiredText(50, 170),
    noIndex: z.boolean().default(false),
    title: requiredText(1, 70),
  })
  .strict()

const editorialEditBaseShape = {
  displayOrder: z.number().int().min(0).max(1_000_000).default(0),
  locale: editorialLocaleSchema,
  mediaPlacements: z.array(contentMediaPlacementEditSchema).max(100).default([]),
  seo: editorialSeoSchema,
  slug: kebabSlugSchema,
} as const

const editorialLifecycleShape = {
  publishedAt: z.date().nullable(),
  status: editorialStatusSchema,
} as const

const editorialRecordMetadataShape = {
  createdAt: z.date(),
  id: uuidSchema,
  updatedAt: z.date(),
  version: z.number().int().positive(),
} as const

function validateMediaPlacementOrdering(
  value: {mediaPlacements: readonly {displayOrder: number}[]},
  context: z.RefinementCtx,
) {
  const positions = value.mediaPlacements.map(({displayOrder}) => displayOrder)

  if (new Set(positions).size !== positions.length) {
    context.addIssue({
      code: 'custom',
      message: 'Media placement ordering must be unique within an entity',
      path: ['mediaPlacements'],
    })
  }
}

function validateEditorialRecord(
  value: {
    mediaPlacements: readonly {displayOrder: number}[]
    publishedAt: Date | null
    status: z.infer<typeof editorialStatusSchema>
  },
  context: z.RefinementCtx,
) {
  if (value.status === 'PUBLISHED' && !value.publishedAt) {
    context.addIssue({
      code: 'custom',
      message: 'publishedAt is required for published content',
      path: ['publishedAt'],
    })
  }

  validateMediaPlacementOrdering(value, context)
}

type DeepReadonly<T> = T extends (...arguments_: never[]) => unknown
  ? T
  : T extends Date
    ? Readonly<T>
    : T extends readonly (infer TItem)[]
      ? readonly DeepReadonly<TItem>[]
      : T extends object
        ? {readonly [TKey in keyof T]: DeepReadonly<T[TKey]>}
        : T

type EditorialLocale = z.infer<typeof editorialLocaleSchema>
type EditorialSeo = DeepReadonly<z.output<typeof editorialSeoSchema>>
type EditorialStatus = z.infer<typeof editorialStatusSchema>

export {
  type DeepReadonly,
  type EditorialLocale,
  type EditorialSeo,
  type EditorialStatus,
  canonicalPathSchema,
  editorialEditBaseShape,
  editorialLifecycleShape,
  editorialLocaleSchema,
  editorialRecordMetadataShape,
  editorialSeoSchema,
  editorialStatusSchema,
  httpsUrlSchema,
  kebabSlugSchema,
  nullableText,
  requiredText,
  uuidSchema,
  validateEditorialRecord,
  validateMediaPlacementOrdering,
}
