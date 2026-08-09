import {createHmac} from 'node:crypto'

import {z} from 'zod'

const identifierSchema = z.string().min(1).max(1_024)
const secretSchema = z.string().min(32)
const actionSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z][a-z0-9_-]*$/)
const policySchema = z.object({
  limit: z.number().int().positive().max(10_000),
  windowMs: z.number().int().positive().max(86_400_000),
})
const storeResultSchema = z.object({
  attempts: z.number().int().nonnegative(),
  windowStart: z.date(),
})

export type RateLimitStore = Readonly<{
  consume: (input: Readonly<{
    action: string
    key: string
    now: Date
    resetBefore: Date
  }>) => Promise<Readonly<{
    attempts: number
    windowStart: Date
  }>>
}>

type ConsumeRateLimitInput = Readonly<{
  action: string
  identifier: string
  now?: Date
  policy: Readonly<{
    limit: number
    windowMs: number
  }>
  secret: string
}>

export async function consumeRateLimit(
  input: ConsumeRateLimitInput,
  store: RateLimitStore,
) {
  const action = actionSchema.parse(input.action)
  const policy = policySchema.parse(input.policy)
  const now = input.now ? new Date(input.now) : new Date()
  const key = createRateLimitKey(input.identifier, input.secret)
  const resetBefore = new Date(now.getTime() - policy.windowMs)
  const consumed = storeResultSchema.parse(
    await store.consume({action, key, now, resetBefore}),
  )
  const allowed = consumed.attempts <= policy.limit
  const retryAfterMs =
    consumed.windowStart.getTime() + policy.windowMs - now.getTime()

  return Object.freeze({
    allowed,
    remaining: Math.max(0, policy.limit - consumed.attempts),
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil(retryAfterMs / 1_000)),
  })
}

export function createRateLimitKey(identifier: string, secret: string) {
  const safeIdentifier = identifierSchema.parse(identifier)
  const safeSecret = secretSchema.parse(secret)

  return createHmac('sha256', safeSecret)
    .update(safeIdentifier)
    .digest('hex')
}
