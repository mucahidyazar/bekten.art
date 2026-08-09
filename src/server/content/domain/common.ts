import {z} from 'zod'

export const contentLocaleSchema = z.enum(['en', 'tr', 'ru', 'ky'])
export const contentStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
export const httpsUrlSchema = z
  .string()
  .trim()
  .url()
  .refine(value => new URL(value).protocol === 'https:', 'URL must use HTTPS')

export const mediaReferenceSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine(value => {
    if (value.startsWith('/') && !value.startsWith('//')) {
      return true
    }

    try {
      const url = new URL(value)

      return url.protocol === 'https:'
    } catch {
      return false
    }
  }, 'Media must use an application path or an HTTPS URL')

export const nullablePublicationRowShape = {
  displayOrder: z.number().int().min(0),
  locale: contentLocaleSchema,
  publishedAt: z.date().nullable(),
  status: contentStatusSchema,
} as const

export const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).nullable().optional()

export const publicationShape = {
  displayOrder: z.number().int().min(0).default(0),
  locale: contentLocaleSchema,
  publishedAt: z.date().nullable().optional(),
  status: contentStatusSchema.default('DRAFT'),
} as const

export const requiredText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum)

export const uuidSchema = z.string().uuid()

export const rowMetadataShape = {
  createdAt: z.date(),
  id: uuidSchema,
  updatedAt: z.date(),
} as const

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase URL-safe slug')
