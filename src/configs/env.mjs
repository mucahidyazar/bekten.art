import {createEnv} from '@t3-oss/env-nextjs'
import {z} from 'zod'

const optionalString = z.preprocess(value => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()

  return trimmed.length === 0 ? undefined : trimmed
}, z.string().min(1).optional())

const optionalEmail = z.preprocess(value => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()

  return trimmed.length === 0 ? undefined : trimmed
}, z.email().max(254).optional())

const optionalUrl = z.preprocess(value => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()

  return trimmed.length === 0 ? undefined : trimmed
}, z.url().optional())

export const env = createEnv({
  server: {
    ALLOW_DASHBOARD_EDITOR_UPSERT: z.enum(['true', 'false']).optional(),
    ALLOW_V2_DEMO_SEED: z.enum(['true', 'false']).optional(),
    APIFY_ACTOR_ID: optionalString,
    APIFY_INSTAGRAM_USERNAME: optionalString,
    APIFY_RESULTS_LIMIT: z
      .string()
      .regex(/^\d+$/u)
      .optional(),
    APIFY_TOKEN: optionalString,
    AUTH_TRUST_PROXY: z.enum(['true', 'false']).optional(),
    DASHBOARD_EDITOR_EMAIL: optionalEmail,
    DASHBOARD_EDITOR_UPSERT_CONFIRMATION: optionalString,
    NEXTAUTH_SECRET: optionalString,
    NEXTAUTH_URL: optionalUrl,
    OUTBOX_DISPATCH_SECRET: optionalString,
    DATABASE_URL: optionalString,
    GOOGLE_SITE_VERIFICATION: optionalString,
    MEDIA_S3_ACCESS_KEY_ID: optionalString,
    MEDIA_S3_BUCKET: optionalString,
    MEDIA_S3_ENDPOINT: z.preprocess(value => {
      if (typeof value !== 'string') {
        return value
      }

      const trimmed = value.trim()

      return trimmed.length === 0 ? undefined : trimmed
    }, z.string().url().optional()),
    MEDIA_S3_FORCE_PATH_STYLE: z.enum(['true']).optional(),
    MEDIA_S3_REGION: optionalString,
    MEDIA_S3_SECRET_ACCESS_KEY: optionalString,
    RESEND_API_KEY: optionalString,
    RESEND_FROM_EMAIL: optionalEmail,
    RESEND_REPLY_TO: optionalEmail,
    RESEND_WEBHOOK_SECRET: optionalString,
    V2_DEMO_SEED_CONFIRMATION: optionalString,
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: optionalString,
    NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID: z.string().min(1),
  },
  runtimeEnv: {
    ALLOW_DASHBOARD_EDITOR_UPSERT:
      process.env.ALLOW_DASHBOARD_EDITOR_UPSERT,
    ALLOW_V2_DEMO_SEED: process.env.ALLOW_V2_DEMO_SEED,
    APIFY_ACTOR_ID: process.env.APIFY_ACTOR_ID,
    APIFY_INSTAGRAM_USERNAME: process.env.APIFY_INSTAGRAM_USERNAME,
    APIFY_RESULTS_LIMIT: process.env.APIFY_RESULTS_LIMIT,
    APIFY_TOKEN: process.env.APIFY_TOKEN,
    AUTH_TRUST_PROXY: process.env.AUTH_TRUST_PROXY,
    DASHBOARD_EDITOR_EMAIL: process.env.DASHBOARD_EDITOR_EMAIL,
    DASHBOARD_EDITOR_UPSERT_CONFIRMATION:
      process.env.DASHBOARD_EDITOR_UPSERT_CONFIRMATION,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    OUTBOX_DISPATCH_SECRET: process.env.OUTBOX_DISPATCH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION,
    MEDIA_S3_ACCESS_KEY_ID: process.env.MEDIA_S3_ACCESS_KEY_ID,
    MEDIA_S3_BUCKET: process.env.MEDIA_S3_BUCKET,
    MEDIA_S3_ENDPOINT: process.env.MEDIA_S3_ENDPOINT,
    MEDIA_S3_FORCE_PATH_STYLE: process.env.MEDIA_S3_FORCE_PATH_STYLE,
    MEDIA_S3_REGION: process.env.MEDIA_S3_REGION,
    MEDIA_S3_SECRET_ACCESS_KEY: process.env.MEDIA_S3_SECRET_ACCESS_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID:
      process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
    NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID:
      process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_REPLY_TO: process.env.RESEND_REPLY_TO,
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
    V2_DEMO_SEED_CONFIRMATION: process.env.V2_DEMO_SEED_CONFIRMATION,
  },
})
