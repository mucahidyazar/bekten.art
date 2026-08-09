export type VerificationTransaction = Readonly<{
  user: Readonly<{
    create: (input: unknown) => Promise<{
      email: string | null
      emailVerified: Date | null
      name: string | null
    }>
    findUnique: (input: unknown) => Promise<{
      email: string | null
      emailVerified: Date | null
      name: string | null
    } | null>
    updateMany: (input: unknown) => Promise<{count: number}>
  }>
  verificationToken: Readonly<{
    create: (input: unknown) => Promise<unknown>
    deleteMany: (input: unknown) => Promise<{count: number}>
    findUnique: (input: unknown) => Promise<{
      expires: Date
      identifier: string
    } | null>
  }>
}>

type VerificationDatabase = Readonly<{
  transaction: <Result>(
    callback: (transaction: VerificationTransaction) => Promise<Result>,
  ) => Promise<Result>
}>

type IssueVerificationInput = Readonly<{
  email: string
  expiresAt: Date
  issuedAt: Date
  name: string
  passwordHash: string
  tokenHash: string
}>

export function createDatabaseEmailVerificationRepository(
  database: VerificationDatabase,
) {
  return Object.freeze({
    issueVerification(input: IssueVerificationInput) {
      return database.transaction(async transaction => {
        const existing = await transaction.user.findUnique({
          select: {email: true, emailVerified: true, name: true},
          where: {email: input.email},
        })

        if (existing?.emailVerified) {
          return Object.freeze({
            email: existing.email ?? input.email,
            name: existing.name,
            shouldDeliver: false,
          })
        }

        let user

        if (existing) {
          const rebound = await transaction.user.updateMany({
            data: {
              name: input.name,
              passwordHash: input.passwordHash,
            },
            where: {email: input.email, emailVerified: null},
          })

          if (rebound.count !== 1) {
            return Object.freeze({
              email: existing.email ?? input.email,
              name: existing.name,
              shouldDeliver: false,
            })
          }

          user = Object.freeze({
            email: existing.email,
            emailVerified: null,
            name: input.name,
          })
        } else {
          user = await transaction.user.create({
            data: {
              email: input.email,
              emailVerified: null,
              name: input.name,
              passwordHash: input.passwordHash,
              role: 'USER',
            },
            select: {email: true, emailVerified: true, name: true},
          })
        }

        await transaction.verificationToken.deleteMany({
          where: {identifier: input.email},
        })
        await transaction.verificationToken.create({
          data: {
            expires: input.expiresAt,
            identifier: input.email,
            token: input.tokenHash,
          },
        })

        return Object.freeze({
          email: user.email ?? input.email,
          name: user.name,
          shouldDeliver: true,
        })
      })
    },

    verifyToken(input: Readonly<{now: Date; tokenHash: string}>) {
      return database.transaction(async transaction => {
        const token = await transaction.verificationToken.findUnique({
          select: {expires: true, identifier: true},
          where: {token: input.tokenHash},
        })

        if (!token) {
          return false
        }

        if (token.expires <= input.now) {
          await transaction.verificationToken.deleteMany({
            where: {token: input.tokenHash},
          })

          return false
        }

        const consumed = await transaction.verificationToken.deleteMany({
          where: {
            expires: {gt: input.now},
            identifier: token.identifier,
            token: input.tokenHash,
          },
        })

        if (consumed.count !== 1) {
          return false
        }

        const verified = await transaction.user.updateMany({
          data: {emailVerified: input.now},
          where: {email: token.identifier, emailVerified: null},
        })

        if (verified.count === 1) {
          await transaction.verificationToken.deleteMany({
            where: {identifier: token.identifier},
          })
        }

        return verified.count === 1
      })
    },
  })
}
