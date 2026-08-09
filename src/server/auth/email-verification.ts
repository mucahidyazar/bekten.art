import {createHash, randomBytes} from 'node:crypto'

import {z} from 'zod'

const registrationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  name: z.string().trim().min(2).max(100),
  password: z.string().min(12).max(1_024),
})
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/)

type IssueVerificationInput = Readonly<{
  email: string
  expiresAt: Date
  issuedAt: Date
  name: string
  passwordHash: string
  tokenHash: string
}>

type EmailVerificationDependencies = Readonly<{
  createToken?: () => string
  deliverVerification: (input: Readonly<{
    idempotencyKey: string
    name: string | null
    to: string
    verificationUrl: string
  }>) => Promise<void>
  hashPassword: (password: string) => Promise<string>
  issueVerification: (
    input: IssueVerificationInput,
  ) => Promise<Readonly<{
    email: string
    name: string | null
    shouldDeliver: boolean
  }>>
  now?: () => Date
  verifyToken: (input: Readonly<{
    now: Date
    tokenHash: string
  }>) => Promise<boolean>
}>

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function createEmailVerificationService(
  dependencies: EmailVerificationDependencies,
) {
  const createToken =
    dependencies.createToken ?? (() => randomBytes(32).toString('base64url'))
  const now = dependencies.now ?? (() => new Date())

  return Object.freeze({
    async register(input: unknown, appUrl: string) {
      const parsed = registrationSchema.safeParse(input)

      if (!parsed.success) {
        throw new Error('REGISTRATION_INPUT_INVALID')
      }

      const baseUrl = new URL(appUrl)
      const rawToken = tokenSchema.parse(createToken())
      const tokenHash = hashToken(rawToken)
      const issuedAt = now()
      const passwordHash = await dependencies.hashPassword(parsed.data.password)
      const target = await dependencies.issueVerification({
        email: parsed.data.email,
        expiresAt: new Date(issuedAt.getTime() + 60 * 60 * 1_000),
        issuedAt,
        name: parsed.data.name,
        passwordHash,
        tokenHash,
      })

      if (target.shouldDeliver) {
        const verificationUrl = new URL('/api/auth/verify-email', baseUrl.origin)

        verificationUrl.searchParams.set('token', rawToken)

        await dependencies.deliverVerification({
          idempotencyKey: `verify-email:${tokenHash}`,
          name: target.name,
          to: target.email,
          verificationUrl: verificationUrl.toString(),
        })
      }

      return Object.freeze({accepted: true})
    },

    async verify(token: string | null | undefined) {
      const parsed = tokenSchema.safeParse(token)

      if (!parsed.success) {
        return false
      }

      return dependencies.verifyToken({
        now: now(),
        tokenHash: hashToken(parsed.data),
      })
    },
  })
}
