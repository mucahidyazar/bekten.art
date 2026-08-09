import {z} from 'zod'

import {
  contentLocaleSchema,
  httpsUrlSchema,
  optionalText,
  requiredText,
  rowMetadataShape,
  uuidSchema,
} from './common'

const emailSchema = z.string().trim().toLowerCase().email().max(320)

export type ContactInfo = z.infer<typeof contactInfoRowSchema>

export type ContactInfoCreate = z.infer<typeof contactInfoCreateSchema>

export type Feedback = z.infer<typeof feedbackRowSchema>

export type FeedbackCreate = z.infer<typeof feedbackCreateSchema>

export type NewsletterSubscriber = z.infer<typeof newsletterSubscriberRowSchema>

export const contactInfoCreateSchema = z
  .object({
    address: requiredText(1, 500),
    email: emailSchema,
    instagramUrl: httpsUrlSchema.nullable().optional(),
    isPrimary: z.boolean().default(false),
    locale: contentLocaleSchema,
    mapEmbedUrl: httpsUrlSchema.nullable().optional(),
    phone: requiredText(3, 40),
    workingHours: optionalText(300),
  })
  .strict()

export type NewsletterSubscriberCreate = z.infer<
  typeof newsletterSubscriberCreateSchema
>
export const contactInfoRowSchema = z.object({
  ...rowMetadataShape,
  address: z.string(),
  email: z.string(),
  instagramUrl: z.string().nullable(),
  isPrimary: z.boolean(),
  locale: contentLocaleSchema,
  mapEmbedUrl: z.string().nullable(),
  phone: z.string(),
  workingHours: z.string().nullable(),
})
export const feedbackCreateSchema = z
  .object({
    email: emailSchema,
    locale: contentLocaleSchema,
    message: requiredText(10, 10_000),
    name: requiredText(1, 120),
    privacyAcceptedAt: z.date(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    source: requiredText(1, 80).default('contact-form'),
    subject: requiredText(1, 200),
  })
  .strict()
export const feedbackRowSchema = z.object({
  ...rowMetadataShape,
  email: z.string(),
  locale: contentLocaleSchema,
  message: z.string(),
  name: z.string(),
  privacyAcceptedAt: z.date(),
  purgeAfter: z.date().nullable(),
  rating: z.number().int().nullable(),
  resolvedAt: z.date().nullable(),
  resolvedByUserId: uuidSchema.nullable(),
  source: z.string(),
  status: z.enum(['NEW', 'IN_REVIEW', 'RESOLVED', 'SPAM']),
  subject: z.string(),
})
export const newsletterSubscriberCreateSchema = z
  .object({
    consentedAt: z.date(),
    email: emailSchema,
    locale: contentLocaleSchema,
    source: requiredText(1, 80),
  })
  .strict()
export const newsletterSubscriberRowSchema = z.object({
  ...rowMetadataShape,
  confirmedAt: z.date().nullable(),
  consentedAt: z.date(),
  email: z.string().email(),
  locale: contentLocaleSchema,
  source: z.string(),
  status: z.enum(['PENDING', 'ACTIVE', 'UNSUBSCRIBED', 'BOUNCED']),
  unsubscribedAt: z.date().nullable(),
})
