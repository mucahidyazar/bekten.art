import {z} from 'zod'

const uuidSchema = z.string().uuid()
const nullableText = (maximum: number) =>
  z.string().trim().max(maximum).nullable().optional()

const contentMediaRoleSchema = z.enum([
  'HERO',
  'THUMBNAIL',
  'GALLERY',
  'INLINE',
  'SEO',
])

const contentMediaCropSchema = z.enum([
  'ORIGINAL',
  'LANDSCAPE',
  'PORTRAIT',
  'SQUARE',
])

const contentMediaEntityTypeSchema = z.enum([
  'ARTWORK',
  'COLLECTION',
  'EXHIBITION',
  'JOURNAL_ENTRY',
  'PAGE',
  'PRESS_ENTRY',
])

const focalPointSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  })
  .strict()

const contentMediaPlacementEditSchema = z
  .object({
    altText: z.string().trim().min(5).max(300),
    caption: nullableText(1000),
    credit: nullableText(300),
    crop: contentMediaCropSchema.default('ORIGINAL'),
    displayOrder: z.number().int().min(0).max(1_000_000),
    focalPoint: focalPointSchema.nullable().optional(),
    mediaObjectId: uuidSchema,
    role: contentMediaRoleSchema,
  })
  .strict()

const contentMediaPlacementPublicSchema = z
  .object(contentMediaPlacementEditSchema.shape)
  .strict()

const contentMediaPlacementRecordSchema = z
  .object({
    ...contentMediaPlacementEditSchema.shape,
    createdAt: z.date(),
    entityId: uuidSchema,
    entityType: contentMediaEntityTypeSchema,
    id: uuidSchema,
    updatedAt: z.date(),
  })
  .strict()

type ContentMediaPlacementEdit = Readonly<
  z.output<typeof contentMediaPlacementEditSchema>
>
type ContentMediaPlacementPublic = Readonly<
  z.output<typeof contentMediaPlacementPublicSchema>
>
type ContentMediaPlacementRecord = Readonly<
  z.output<typeof contentMediaPlacementRecordSchema>
>

export {
  type ContentMediaPlacementEdit,
  type ContentMediaPlacementPublic,
  type ContentMediaPlacementRecord,
  contentMediaCropSchema,
  contentMediaEntityTypeSchema,
  contentMediaPlacementEditSchema,
  contentMediaPlacementPublicSchema,
  contentMediaPlacementRecordSchema,
  contentMediaRoleSchema,
  focalPointSchema,
}
