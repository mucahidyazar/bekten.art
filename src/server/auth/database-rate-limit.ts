import {z} from 'zod'

import type {RateLimitStore} from './rate-limit'

const consumedRowSchema = z.object({
  attempts: z.coerce.number().int().nonnegative(),
  window_start: z.coerce.date(),
})

type DatabaseRateLimitInput = Parameters<RateLimitStore['consume']>[0]

type DatabaseRateLimitDependencies = Readonly<{
  consume: (input: DatabaseRateLimitInput) => Promise<unknown>
}>

export function createDatabaseRateLimitStore(
  database: DatabaseRateLimitDependencies,
): RateLimitStore {
  return Object.freeze({
    async consume(input) {
      const parsedRow = consumedRowSchema.safeParse(await database.consume(input))

      if (!parsedRow.success) {
        throw new Error('Unable to persist the authentication rate limit')
      }

      return Object.freeze({
        attempts: parsedRow.data.attempts,
        windowStart: parsedRow.data.window_start,
      })
    },
  })
}
