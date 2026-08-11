import {z} from 'zod'

import {
  editorialEditBaseShape,
  editorialLifecycleShape,
  editorialRecordMetadataShape,
  editorialSeoSchema,
  httpsUrlSchema,
  nullableText,
  requiredText,
  uuidSchema,
  validateEditorialRecord,
  validateMediaPlacementOrdering,
} from './common-contracts'
import {
  contentMediaPlacementPublicSchema,
  contentMediaPlacementRecordSchema,
} from './media-placement'

import type {DeepReadonly} from './common-contracts'

const titleSchema = requiredText(1, 200)
const bodySchema = requiredText(20, 100_000)
const descriptionSchema = requiredText(20, 5000)

const editorialRecordBaseShape = {
  ...editorialEditBaseShape,
  ...editorialLifecycleShape,
  ...editorialRecordMetadataShape,
  mediaPlacements: z.array(contentMediaPlacementRecordSchema).max(100),
} as const

const editorialPublicBaseShape = {
  locale: editorialEditBaseShape.locale,
  mediaPlacements: z.array(contentMediaPlacementPublicSchema).max(100),
  publishedAt: z.date(),
  seo: editorialSeoSchema,
  slug: editorialEditBaseShape.slug,
} as const

function validateHeroPlacement(
  value: {mediaPlacements: readonly {role: string}[]},
  context: z.RefinementCtx,
) {
  if (!value.mediaPlacements.some(({role}) => role === 'HERO')) {
    context.addIssue({
      code: 'custom',
      message: 'Published artwork requires a HERO media placement',
      path: ['mediaPlacements'],
    })
  }
}

function validateArtworkRecord(
  value: {
    mediaPlacements: readonly {displayOrder: number; role: string}[]
    publishedAt: Date | null
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  },
  context: z.RefinementCtx,
) {
  validateEditorialRecord(value, context)

  if (value.status === 'PUBLISHED') {
    validateHeroPlacement(value, context)
  }
}

function validateArtworkPublic(
  value: {mediaPlacements: readonly {displayOrder: number; role: string}[]},
  context: z.RefinementCtx,
) {
  validateMediaPlacementOrdering(value, context)
  validateHeroPlacement(value, context)
}

const artworkAvailabilitySchema = z.enum([
  'AVAILABLE',
  'ON_REQUEST',
  'RESERVED',
  'NOT_AVAILABLE',
])

const artworkShape = {
  availability: artworkAvailabilitySchema.default('ON_REQUEST'),
  collectionId: uuidSchema.nullable().optional(),
  description: descriptionSchema,
  dimensions: nullableText(160),
  medium: nullableText(200),
  title: titleSchema,
  year: z.number().int().min(1000).max(3000).nullable().optional(),
} as const

const artworkEditSchema = z
  .object({...editorialEditBaseShape, ...artworkShape})
  .strict()
  .superRefine(validateMediaPlacementOrdering)

const artworkPublicSchema = z
  .object({...editorialPublicBaseShape, ...artworkShape})
  .strict()
  .superRefine(validateArtworkPublic)

const artworkRecordSchema = z
  .object({...editorialRecordBaseShape, ...artworkShape})
  .strict()
  .superRefine(validateArtworkRecord)

const collectionShape = {
  description: descriptionSchema,
  title: titleSchema,
} as const

const collectionEditSchema = z
  .object({...editorialEditBaseShape, ...collectionShape})
  .strict()
  .superRefine(validateMediaPlacementOrdering)

const collectionRecordSchema = z
  .object({...editorialRecordBaseShape, ...collectionShape})
  .strict()
  .superRefine(validateEditorialRecord)

const collectionPublicSchema = z
  .object({...editorialPublicBaseShape, ...collectionShape})
  .strict()
  .superRefine(validateMediaPlacementOrdering)

const exhibitionShape = {
  body: bodySchema,
  city: nullableText(160),
  country: nullableText(160),
  endsAt: z.date().nullable().optional(),
  startsAt: z.date(),
  subtitle: nullableText(300),
  title: titleSchema,
  venue: nullableText(240),
} as const

function validateExhibitionDates(
  value: {endsAt?: Date | null; startsAt: Date},
  context: z.RefinementCtx,
) {
  if (value.endsAt && value.endsAt < value.startsAt) {
    context.addIssue({
      code: 'custom',
      message: 'endsAt must not be earlier than startsAt',
      path: ['endsAt'],
    })
  }
}

function validateExhibitionEdit(
  value: z.output<z.ZodObject<typeof exhibitionShape>> & {
    mediaPlacements: readonly {displayOrder: number}[]
  },
  context: z.RefinementCtx,
) {
  validateMediaPlacementOrdering(value, context)
  validateExhibitionDates(value, context)
}

function validateExhibitionRecord(
  value: z.output<z.ZodObject<typeof exhibitionShape>> & {
    mediaPlacements: readonly {displayOrder: number}[]
    publishedAt: Date | null
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  },
  context: z.RefinementCtx,
) {
  validateEditorialRecord(value, context)
  validateExhibitionDates(value, context)
}

const exhibitionEditSchema = z
  .object({...editorialEditBaseShape, ...exhibitionShape})
  .strict()
  .superRefine(validateExhibitionEdit)

const exhibitionRecordSchema = z
  .object({...editorialRecordBaseShape, ...exhibitionShape})
  .strict()
  .superRefine(validateExhibitionRecord)

const exhibitionPublicSchema = z
  .object({...editorialPublicBaseShape, ...exhibitionShape})
  .strict()
  .superRefine(validateExhibitionEdit)

const journalEntryShape = {
  body: bodySchema,
  excerpt: requiredText(20, 1000),
  title: titleSchema,
} as const

const journalEntryEditSchema = z
  .object({...editorialEditBaseShape, ...journalEntryShape})
  .strict()
  .superRefine(validateMediaPlacementOrdering)

const journalEntryRecordSchema = z
  .object({...editorialRecordBaseShape, ...journalEntryShape})
  .strict()
  .superRefine(validateEditorialRecord)

const journalEntryPublicSchema = z
  .object({...editorialPublicBaseShape, ...journalEntryShape})
  .strict()
  .superRefine(validateMediaPlacementOrdering)

const pageShape = {
  body: bodySchema,
  eyebrow: nullableText(120),
  title: titleSchema,
} as const

const pageEditSchema = z
  .object({...editorialEditBaseShape, ...pageShape})
  .strict()
  .superRefine(validateMediaPlacementOrdering)

const pageRecordSchema = z
  .object({...editorialRecordBaseShape, ...pageShape})
  .strict()
  .superRefine(validateEditorialRecord)

const pagePublicSchema = z
  .object({...editorialPublicBaseShape, ...pageShape})
  .strict()
  .superRefine(validateMediaPlacementOrdering)

const pressCategorySchema = z.enum([
  'INTERVIEW',
  'REVIEW',
  'FEATURE',
  'NEWS',
])

const pressEntryShape = {
  body: nullableText(100_000),
  excerpt: requiredText(20, 2000),
  outlet: requiredText(1, 200),
  pressCategory: pressCategorySchema,
  publishedOn: z.date().nullable().optional(),
  sourceUrl: httpsUrlSchema,
  subtitle: nullableText(300),
  title: titleSchema,
} as const

const pressEntryEditSchema = z
  .object({...editorialEditBaseShape, ...pressEntryShape})
  .strict()
  .superRefine(validateMediaPlacementOrdering)

const pressEntryRecordSchema = z
  .object({...editorialRecordBaseShape, ...pressEntryShape})
  .strict()
  .superRefine(validateEditorialRecord)

const pressEntryPublicSchema = z
  .object({...editorialPublicBaseShape, ...pressEntryShape})
  .strict()
  .superRefine(validateMediaPlacementOrdering)

type ArtworkEdit = DeepReadonly<z.output<typeof artworkEditSchema>>
type ArtworkPublic = DeepReadonly<z.output<typeof artworkPublicSchema>>
type ArtworkRecord = DeepReadonly<z.output<typeof artworkRecordSchema>>
type CollectionEdit = DeepReadonly<z.output<typeof collectionEditSchema>>
type CollectionPublic = DeepReadonly<z.output<typeof collectionPublicSchema>>
type CollectionRecord = DeepReadonly<z.output<typeof collectionRecordSchema>>
type ExhibitionEdit = DeepReadonly<z.output<typeof exhibitionEditSchema>>
type ExhibitionPublic = DeepReadonly<z.output<typeof exhibitionPublicSchema>>
type ExhibitionRecord = DeepReadonly<z.output<typeof exhibitionRecordSchema>>
type JournalEntryEdit = DeepReadonly<z.output<typeof journalEntryEditSchema>>
type JournalEntryPublic = DeepReadonly<
  z.output<typeof journalEntryPublicSchema>
>
type JournalEntryRecord = DeepReadonly<
  z.output<typeof journalEntryRecordSchema>
>
type PageEdit = DeepReadonly<z.output<typeof pageEditSchema>>
type PagePublic = DeepReadonly<z.output<typeof pagePublicSchema>>
type PageRecord = DeepReadonly<z.output<typeof pageRecordSchema>>
type PressEntryEdit = DeepReadonly<z.output<typeof pressEntryEditSchema>>
type PressEntryPublic = DeepReadonly<z.output<typeof pressEntryPublicSchema>>
type PressEntryRecord = DeepReadonly<z.output<typeof pressEntryRecordSchema>>

export {
  type ArtworkEdit,
  type ArtworkPublic,
  type ArtworkRecord,
  type CollectionEdit,
  type CollectionPublic,
  type CollectionRecord,
  type ExhibitionEdit,
  type ExhibitionPublic,
  type ExhibitionRecord,
  type JournalEntryEdit,
  type JournalEntryPublic,
  type JournalEntryRecord,
  type PageEdit,
  type PagePublic,
  type PageRecord,
  type PressEntryEdit,
  type PressEntryPublic,
  type PressEntryRecord,
  artworkAvailabilitySchema,
  artworkEditSchema,
  artworkPublicSchema,
  artworkRecordSchema,
  collectionEditSchema,
  collectionPublicSchema,
  collectionRecordSchema,
  exhibitionEditSchema,
  exhibitionPublicSchema,
  exhibitionRecordSchema,
  journalEntryEditSchema,
  journalEntryPublicSchema,
  journalEntryRecordSchema,
  pageEditSchema,
  pagePublicSchema,
  pageRecordSchema,
  pressCategorySchema,
  pressEntryEditSchema,
  pressEntryPublicSchema,
  pressEntryRecordSchema,
}
