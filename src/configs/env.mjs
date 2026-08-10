import {createEnv} from '@t3-oss/env-nextjs'
import {z} from 'zod'

const optionalString = z.preprocess(value => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()

  return trimmed.length === 0 ? undefined : trimmed
}, z.string().min(1).optional())

export const env = createEnv({
  server: {
    AUTH_TRUST_PROXY: z.enum(['true', 'false']).optional(),
    NEXTAUTH_SECRET: optionalString,
    NEXTAUTH_URL: z.string().url().optional(),
    OUTBOX_DISPATCH_SECRET: optionalString,
    DATABASE_URL: optionalString,
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
    RESEND_FROM_EMAIL: optionalString,
    RESEND_REPLY_TO: optionalString,
    RESEND_WEBHOOK_SECRET: optionalString,
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: optionalString,
    NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID: z.string().min(1),
  },
  runtimeEnv: {
    AUTH_TRUST_PROXY: process.env.AUTH_TRUST_PROXY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    OUTBOX_DISPATCH_SECRET: process.env.OUTBOX_DISPATCH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
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
  },
})
