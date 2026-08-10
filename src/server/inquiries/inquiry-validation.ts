import {z} from 'zod'

import {contentLocaleSchema, uuidSchema} from '@/server/content/domain'

const emailSchema = z.string().trim().toLowerCase().email().max(320)
const messageSchema = z.string().trim().min(10).max(4_000)
const optionalMessageSchema = z.string().trim().min(10).max(4_000).optional()
const optionalPhoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(32)
  .regex(/^\+?[0-9][0-9 ()-]*$/u)
  .optional()

const sharedPublicShape = {
  consent: z.literal(true),
  email: emailSchema,
  locale: contentLocaleSchema,
  name: z.string().trim().min(2).max(120),
  phone: optionalPhoneSchema,
  submissionId: uuidSchema,
} as const

const availabilityInquiryInputSchema = z
  .object({
    ...sharedPublicShape,
    message: optionalMessageSchema,
    relatedArtworkId: uuidSchema,
    type: z.literal('AVAILABILITY'),
  })
  .strict()

const commissionInquiryInputSchema = z
  .object({
    ...sharedPublicShape,
    brief: z.string().trim().min(20).max(4_000),
    message: optionalMessageSchema,
    preferredTimeline: z.string().trim().min(2).max(160).optional(),
    type: z.literal('COMMISSION'),
  })
  .strict()

const generalInquiryInputSchema = z
  .object({
    ...sharedPublicShape,
    message: messageSchema,
    subject: z.string().trim().min(2).max(120),
    type: z.literal('GENERAL'),
  })
  .strict()

const isoCalendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u)
  .refine(value => {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    )
  }, 'Date must be a real calendar date')

const privateViewingInquiryInputSchema = z
  .object({
    ...sharedPublicShape,
    attendees: z.number().int().min(1).max(12).optional(),
    message: optionalMessageSchema,
    preferredDates: z.array(isoCalendarDateSchema).min(1).max(3),
    relatedArtworkId: uuidSchema.optional(),
    type: z.literal('PRIVATE_VIEWING'),
  })
  .strict()

export type InquirySubmissionContext = z.output<
  typeof inquirySubmissionContextSchema
>

export type PublicInquiryInput = z.output<typeof publicInquiryInputSchema>

export const inquiryLabelSchema = z
  .string()
  .trim()
  .min(1)
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)

export const inquiryStatusSchema = z.enum([
  'NEW',
  'IN_REVIEW',
  'RESPONDED',
  'CLOSED',
  'ARCHIVED',
])

export const inquirySubmissionContextSchema = z
  .object({
    abuseKeyHash: z.string().regex(/^[a-f0-9]{64}$/u),
    source: z.literal('WEBSITE'),
  })
  .strict()

export const publicInquiryInputSchema = z.discriminatedUnion('type', [
  availabilityInquiryInputSchema,
  commissionInquiryInputSchema,
  privateViewingInquiryInputSchema,
  generalInquiryInputSchema,
])
