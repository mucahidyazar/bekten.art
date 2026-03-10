import {createEnv} from '@t3-oss/env-nextjs'
import {z} from 'zod'

const optionalString = z.preprocess(
  value => {
    if (typeof value !== 'string') {
      return value
    }

    const trimmed = value.trim()

    return trimmed.length === 0 ? undefined : trimmed
  },
  z.string().min(1).optional(),
)

export const env = createEnv({
  server: {
    AUTH_GOOGLE_ID: optionalString,
    AUTH_GOOGLE_SECRET: optionalString,
    AUTH_SECRET: optionalString,
    DATABASE_URL: optionalString,
    POCKETBASE_ADMIN_EMAIL: optionalString,
    POCKETBASE_ADMIN_PASSWORD: optionalString,
    POCKETBASE_STORAGE_COLLECTION: optionalString,
    POCKETBASE_URL: z.preprocess(
      value => {
        if (typeof value !== 'string') {
          return value
        }

        const trimmed = value.trim()

        return trimmed.length === 0 ? undefined : trimmed
      },
      z.string().url().optional(),
    ),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID: z.string().min(1),
  },
  runtimeEnv: {
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID:
      process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID,
    POCKETBASE_ADMIN_EMAIL: process.env.POCKETBASE_ADMIN_EMAIL,
    POCKETBASE_ADMIN_PASSWORD: process.env.POCKETBASE_ADMIN_PASSWORD,
    POCKETBASE_STORAGE_COLLECTION: process.env.POCKETBASE_STORAGE_COLLECTION,
    POCKETBASE_URL: process.env.POCKETBASE_URL,
  },
})
