type ResetUser = Readonly<{
  email: string | null
  emailVerified: Date | null
  id: string
  name: string | null
  passwordHash: string | null
}>

export type PasswordResetTransaction = Readonly<{
  passwordResetToken: Readonly<{
    create: (input: unknown) => Promise<unknown>
    deleteMany: (input: unknown) => Promise<Readonly<{count: number}>>
    findUnique: (input: unknown) => Promise<Readonly<{
      expiresAt: Date
      id: string
      usedAt: Date | null
      userId: string
    }> | null>
    updateMany: (input: unknown) => Promise<Readonly<{count: number}>>
  }>
  session: Readonly<{
    deleteMany: (input: unknown) => Promise<Readonly<{count: number}>>
  }>
  user: Readonly<{
    findUnique: (input: unknown) => Promise<ResetUser | null>
    updateMany: (input: unknown) => Promise<Readonly<{count: number}>>
  }>
}>

type PasswordResetDatabase = Readonly<{
  transaction: <Result>(
    callback: (transaction: PasswordResetTransaction) => Promise<Result>,
  ) => Promise<Result>
}>

export function createDatabasePasswordResetRepository(
  database: PasswordResetDatabase,
) {
  return Object.freeze({
    issueReset(
      input: Readonly<{
        email: string
        expiresAt: Date
        issuedAt: Date
        tokenHash: string
      }>,
    ) {
      return database.transaction(async transaction => {
        const user = await transaction.user.findUnique({
          select: {
            email: true,
            emailVerified: true,
            id: true,
            name: true,
            passwordHash: true,
          },
          where: {email: input.email},
        })

        if (!user?.email || !user.emailVerified || !user.passwordHash) {
          return null
        }

        await transaction.passwordResetToken.deleteMany({
          where: {userId: user.id},
        })
        await transaction.passwordResetToken.create({
          data: {
            expiresAt: input.expiresAt,
            tokenHash: input.tokenHash,
            userId: user.id,
          },
        })

        return Object.freeze({
          email: user.email,
          name: user.name,
          shouldDeliver: true,
        })
      })
    },

    consumeReset(
      input: Readonly<{
        now: Date
        passwordHash: string
        tokenHash: string
      }>,
    ) {
      return database.transaction(async transaction => {
        const token = await transaction.passwordResetToken.findUnique({
          select: {expiresAt: true, id: true, usedAt: true, userId: true},
          where: {tokenHash: input.tokenHash},
        })

        if (!token) {
          return false
        }

        if (token.usedAt || token.expiresAt <= input.now) {
          await transaction.passwordResetToken.deleteMany({
            where: {id: token.id},
          })

          return false
        }

        const consumed = await transaction.passwordResetToken.updateMany({
          data: {usedAt: input.now},
          where: {
            expiresAt: {gt: input.now},
            id: token.id,
            usedAt: null,
          },
        })

        if (consumed.count !== 1) {
          return false
        }

        const updated = await transaction.user.updateMany({
          data: {
            passwordHash: input.passwordHash,
            passwordResetRequired: false,
            sessionVersion: {increment: 1},
          },
          where: {id: token.userId},
        })

        if (updated.count !== 1) {
          throw new Error('PASSWORD_RESET_STATE_INVALID')
        }

        await Promise.all([
          transaction.session.deleteMany({where: {userId: token.userId}}),
          transaction.passwordResetToken.deleteMany({
            where: {userId: token.userId},
          }),
        ])

        return true
      })
    },
  })
}
