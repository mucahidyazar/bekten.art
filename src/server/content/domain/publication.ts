import {z} from 'zod'

import {
  httpsUrlSchema,
  mediaReferenceSchema,
  nullablePublicationRowShape,
  optionalText,
  publicationShape,
  requiredText,
  rowMetadataShape,
  slugSchema,
} from './common'

function validatePublication(
  value: {publishedAt?: Date | null; status: string},
  context: z.RefinementCtx,
) {
  if (value.status === 'PUBLISHED' && !value.publishedAt) {
    context.addIssue({
      code: 'custom',
      message: 'publishedAt is required for published content',
      path: ['publishedAt'],
    })
  }
}

function validateOptionalImageAlt(
  value: {imageAlt?: string | null; imageUrl?: string | null},
  context: z.RefinementCtx,
) {
  if (value.imageUrl && !value.imageAlt) {
    context.addIssue({
      code: 'custom',
      message: 'imageAlt is required when imageUrl is set',
      path: ['imageAlt'],
    })
  }
}

export const artworkCreateSchema = z
  .object({
    ...publicationShape,
    currency: z.string().length(3).toUpperCase().nullable().optional(),
    description: requiredText(20, 5000),
    dimensions: optionalText(120),
    imageAlt: requiredText(5, 300),
    imageUrl: mediaReferenceSchema,
    isAvailable: z.boolean().default(true),
    medium: optionalText(160),
    objectKey: optionalText(1024),
    priceMinor: z.number().int().nonnegative().nullable().optional(),
    slug: slugSchema,
    title: requiredText(1, 200),
    year: z.number().int().min(1000).max(3000).nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const hasPrice = value.priceMinor !== null && value.priceMinor !== undefined
    const hasCurrency = value.currency !== null && value.currency !== undefined

    if (hasPrice !== hasCurrency) {
      context.addIssue({
        code: 'custom',
        message: 'priceMinor and currency must be set together',
        path: ['priceMinor'],
      })
    }

    validatePublication(value, context)
  })

export const artworkRowSchema = z.object({
  ...rowMetadataShape,
  ...nullablePublicationRowShape,
  currency: z.string().length(3).nullable(),
  description: z.string(),
  dimensions: z.string().nullable(),
  imageAlt: z.string().min(1),
  imageUrl: z.string(),
  isAvailable: z.boolean(),
  medium: z.string().nullable(),
  objectKey: z.string().nullable(),
  priceMinor: z.number().int().nonnegative().nullable(),
  slug: z.string(),
  title: z.string(),
  year: z.number().int().nullable(),
})

export const artistStatCreateSchema = z
  .object({
    ...publicationShape,
    description: requiredText(1, 500),
    label: requiredText(1, 100),
    value: requiredText(1, 40),
  })
  .strict()
  .superRefine(validatePublication)

export const memoryCreateSchema = z
  .object({
    ...publicationShape,
    capturedAt: z.date().nullable().optional(),
    description: requiredText(20, 2000),
    imageAlt: requiredText(5, 300),
    imageUrl: mediaReferenceSchema,
    objectKey: optionalText(1024),
    slug: slugSchema,
    title: requiredText(1, 160),
  })
  .strict()
  .superRefine(validatePublication)

export type Artwork = z.infer<typeof artworkRowSchema>

export const newsArticleCreateSchema = z
  .object({
    ...publicationShape,
    address: optionalText(300),
    body: requiredText(20, 100_000),
    category: z
      .enum(['NEWS', 'FEATURE', 'INTERVIEW', 'EXHIBITION', 'BIOGRAPHY'])
      .default('NEWS'),
    eventAt: z.date().nullable().optional(),
    excerpt: requiredText(20, 1000),
    imageAlt: optionalText(300),
    imageUrl: mediaReferenceSchema.nullable().optional(),
    location: optionalText(200),
    note: optionalText(500),
    objectKey: optionalText(1024),
    slug: slugSchema,
    sourceUrl: httpsUrlSchema.nullable().optional(),
    subtitle: optionalText(300),
    title: requiredText(1, 200),
  })
  .strict()
  .superRefine((value, context) => {
    validatePublication(value, context)
    validateOptionalImageAlt(value, context)
  })

export type ArtistStat = z.infer<typeof artistStatRowSchema>

export const newsArticleRowSchema = z.object({
  ...rowMetadataShape,
  ...nullablePublicationRowShape,
  address: z.string().nullable(),
  body: z.string(),
  category: z.enum(['NEWS', 'FEATURE', 'INTERVIEW', 'EXHIBITION', 'BIOGRAPHY']),
  eventAt: z.date().nullable(),
  excerpt: z.string(),
  imageAlt: z.string().nullable(),
  imageUrl: z.string().nullable(),
  location: z.string().nullable(),
  note: z.string().nullable(),
  objectKey: z.string().nullable(),
  slug: z.string(),
  sourceUrl: z.string().nullable(),
  subtitle: z.string().nullable(),
  title: z.string(),
})

export type ArtistStatCreate = z.infer<typeof artistStatCreateSchema>

export const pressItemCreateSchema = z
  .object({
    ...publicationShape,
    category: z.enum(['INTERVIEW', 'REVIEW', 'FEATURE', 'NEWS']),
    content: optionalText(100_000),
    description: requiredText(20, 2000),
    imageAlt: optionalText(300),
    imageUrl: mediaReferenceSchema.nullable().optional(),
    objectKey: optionalText(1024),
    outlet: requiredText(1, 200),
    publishedOn: z.date().nullable().optional(),
    sourceUrl: httpsUrlSchema,
    subtitle: optionalText(300),
    title: requiredText(1, 200),
  })
  .strict()
  .superRefine((value, context) => {
    validatePublication(value, context)
    validateOptionalImageAlt(value, context)
  })

export type ArtworkCreate = z.infer<typeof artworkCreateSchema>

export const pressItemRowSchema = z.object({
  ...rowMetadataShape,
  ...nullablePublicationRowShape,
  category: z.enum(['INTERVIEW', 'REVIEW', 'FEATURE', 'NEWS']),
  content: z.string().nullable(),
  description: z.string(),
  imageAlt: z.string().nullable(),
  imageUrl: z.string().nullable(),
  objectKey: z.string().nullable(),
  outlet: z.string(),
  publishedOn: z.date().nullable(),
  sourceUrl: z.string(),
  subtitle: z.string().nullable(),
  title: z.string(),
})

export type Memory = z.infer<typeof memoryRowSchema>

export const testimonialCreateSchema = z
  .object({
    ...publicationShape,
    avatarAlt: optionalText(300),
    avatarUrl: mediaReferenceSchema.nullable().optional(),
    category: z.enum([
      'ARTIST',
      'BUSINESSPERSON',
      'POLITICIAN',
      'COLLECTOR',
      'CRITIC',
      'JOURNALIST',
      'CURATOR',
    ]),
    company: optionalText(150),
    location: optionalText(150),
    name: requiredText(1, 120),
    objectKey: optionalText(1024),
    quote: requiredText(10, 2000),
    sourceUrl: httpsUrlSchema.nullable().optional(),
    title: requiredText(1, 180),
  })
  .strict()
  .superRefine((value, context) => {
    validatePublication(value, context)
    validateOptionalImageAlt(
      {imageAlt: value.avatarAlt, imageUrl: value.avatarUrl},
      context,
    )
  })

export type MemoryCreate = z.infer<typeof memoryCreateSchema>
export const testimonialRowSchema = z.object({
  ...rowMetadataShape,
  ...nullablePublicationRowShape,
  avatarAlt: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  category: z.enum([
    'ARTIST',
    'BUSINESSPERSON',
    'POLITICIAN',
    'COLLECTOR',
    'CRITIC',
    'JOURNALIST',
    'CURATOR',
  ]),
  company: z.string().nullable(),
  location: z.string().nullable(),
  name: z.string(),
  objectKey: z.string().nullable(),
  quote: z.string(),
  sourceUrl: z.string().nullable(),
  title: z.string(),
})
export type NewsArticle = z.infer<typeof newsArticleRowSchema>
export const workshopItemCreateSchema = z
  .object({
    ...publicationShape,
    description: requiredText(20, 5000),
    endsAt: z.date().nullable().optional(),
    imageAlt: optionalText(300),
    imageUrl: mediaReferenceSchema.nullable().optional(),
    location: optionalText(200),
    objectKey: optionalText(1024),
    registrationUrl: httpsUrlSchema.nullable().optional(),
    slug: slugSchema,
    startsAt: z.date().nullable().optional(),
    title: requiredText(1, 200),
  })
  .strict()
  .superRefine((value, context) => {
    validatePublication(value, context)
    validateOptionalImageAlt(value, context)

    if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt) {
      context.addIssue({
        code: 'custom',
        message: 'endsAt must be after startsAt',
        path: ['endsAt'],
      })
    }
  })
export type NewsArticleCreate = z.infer<typeof newsArticleCreateSchema>
export const workshopItemRowSchema = z.object({
  ...rowMetadataShape,
  ...nullablePublicationRowShape,
  description: z.string(),
  endsAt: z.date().nullable(),
  imageAlt: z.string().nullable(),
  imageUrl: z.string().nullable(),
  location: z.string().nullable(),
  objectKey: z.string().nullable(),
  registrationUrl: z.string().nullable(),
  slug: z.string(),
  startsAt: z.date().nullable(),
  title: z.string(),
})
export type PressItem = z.infer<typeof pressItemRowSchema>
export const memoryRowSchema = z.object({
  ...rowMetadataShape,
  ...nullablePublicationRowShape,
  capturedAt: z.date().nullable(),
  description: z.string(),
  imageAlt: z.string(),
  imageUrl: z.string(),
  objectKey: z.string().nullable(),
  slug: z.string(),
  title: z.string(),
})
export type PressItemCreate = z.infer<typeof pressItemCreateSchema>
export const artistStatRowSchema = z.object({
  ...rowMetadataShape,
  ...nullablePublicationRowShape,
  description: z.string(),
  label: z.string(),
  value: z.string(),
})
export type Testimonial = z.infer<typeof testimonialRowSchema>
export type TestimonialCreate = z.infer<typeof testimonialCreateSchema>
export type WorkshopItem = z.infer<typeof workshopItemRowSchema>
export type WorkshopItemCreate = z.infer<typeof workshopItemCreateSchema>
