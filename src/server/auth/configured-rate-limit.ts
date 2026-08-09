import {prisma} from '@/lib/db'

import {createDatabaseRateLimitStore} from './database-rate-limit'
import {consumeRateLimit} from './rate-limit'
import {getRequiredAuthSecret} from './request-context'

const store = createDatabaseRateLimitStore({
  async consume({action, key, now, resetBefore}) {
    const rows = await prisma.$queryRaw<
      Array<{attempts: number; window_start: Date}>
    >`
      INSERT INTO auth_rate_limits (
        action,
        key,
        attempts,
        window_start,
        created_at,
        updated_at
      )
      VALUES (${action}, ${key}, 1, ${now}, ${now}, ${now})
      ON CONFLICT (action, key) DO UPDATE
      SET
        attempts = CASE
          WHEN auth_rate_limits.window_start <= ${resetBefore} THEN 1
          ELSE auth_rate_limits.attempts + 1
        END,
        window_start = CASE
          WHEN auth_rate_limits.window_start <= ${resetBefore} THEN ${now}
          ELSE auth_rate_limits.window_start
        END,
        updated_at = ${now}
      RETURNING attempts, window_start
    `

    return rows[0]
  },
})

export function consumeConfiguredRateLimit(input: Readonly<{
  action: string
  identifier: string
  policy: Readonly<{limit: number; windowMs: number}>
}>) {
  return consumeRateLimit(
    {...input, secret: getRequiredAuthSecret()},
    store,
  )
}
