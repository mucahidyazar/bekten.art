import {createHash, randomBytes} from 'node:crypto'

import {z} from 'zod'

import {contentLocaleSchema} from '@/server/content/domain'

const requestSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(320),
    locale: contentLocaleSchema,
  })
  .strict()
const resetSchema = z
  .object({
    password: z.string().min(12).max(1_024),
    token: z.string().regex(/^[A-Za-z0-9_-]{43}$/u),
  })
  .strict()

type ResetTarget = Readonly<{
  email: string
  name: string | null
  shouldDeliver: boolean
}>

type PasswordResetDependencies = Readonly<{
  consumeReset: (
    input: Readonly<{
      now: Date
      passwordHash: string
      tokenHash: string
    }>,
  ) => Promise<boolean>
  createToken?: () => string
  deliverReset: (
    input: Readonly<{
      idempotencyKey: string
      locale: z.infer<typeof contentLocaleSchema>
      name: string | null
      resetUrl: string
      to: string
    }>,
  ) => Promise<void>
  hashPassword: (password: string) => Promise<string>
  issueReset: (
    input: Readonly<{
      email: string
      expiresAt: Date
      issuedAt: Date
      tokenHash: string
    }>,
  ) => Promise<ResetTarget | null>
  now?: () => Date
}>

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function createPasswordResetService(
  dependencies: PasswordResetDependencies,
) {
  const createToken =
    dependencies.createToken ?? (() => randomBytes(32).toString('base64url'))
  const now = dependencies.now ?? (() => new Date())

  return Object.freeze({
    async request(input: unknown, appUrl: string) {
      const parsed = requestSchema.safeParse(input)

      if (!parsed.success) {
        throw new Error('PASSWORD_RESET_INPUT_INVALID')
      }

      const rawToken = resetSchema.shape.token.parse(createToken())
      const tokenHash = hashToken(rawToken)
      const issuedAt = now()
      const target = await dependencies.issueReset({
        email: parsed.data.email,
        expiresAt: new Date(issuedAt.getTime() + 30 * 60 * 1_000),
        issuedAt,
        tokenHash,
      })

      if (target?.shouldDeliver) {
        const resetUrl = new URL(
          `/${parsed.data.locale}/reset-password`,
          new URL(appUrl).origin,
        )

        resetUrl.searchParams.set('token', rawToken)
        await dependencies.deliverReset({
          idempotencyKey: `password-reset:${tokenHash}`,
          locale: parsed.data.locale,
          name: target.name,
          resetUrl: resetUrl.toString(),
          to: target.email,
        })
      }

      return Object.freeze({accepted: true})
    },

    async reset(input: unknown) {
      const parsed = resetSchema.safeParse(input)

      if (!parsed.success) {
        throw new Error('PASSWORD_RESET_INPUT_INVALID')
      }

      const passwordHash = await dependencies.hashPassword(parsed.data.password)

      return dependencies.consumeReset({
        now: now(),
        passwordHash,
        tokenHash: hashToken(parsed.data.token),
      })
    },
  })
}
