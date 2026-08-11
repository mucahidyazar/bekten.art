import {z} from 'zod'

import {isStudioEditorRole} from './roles'

import type {StudioMagicLinkQueueInput} from './magic-link-coordinator'

type StudioAuthTransaction = Readonly<{
  auditEvent: Readonly<{create: (args: unknown) => Promise<unknown>}>
  outboxJob: Readonly<{create: (args: unknown) => Promise<unknown>}>
  user: Readonly<{findUnique: (args: unknown) => Promise<unknown | null>}>
  verificationToken: Readonly<{
    create: (args: unknown) => Promise<unknown>
  }>
}>

export type StudioAuthDatabase = Readonly<{
  $transaction: <Result>(
    callback: (transaction: StudioAuthTransaction) => Promise<Result>,
  ) => Promise<Result>
}>

const studioUserSchema = z.object({
  id: z.string().uuid(),
  role: z.string(),
})

export function createDatabaseStudioMagicLinkStore(
  database: StudioAuthDatabase,
) {
  return Object.freeze({
    async queue(input: StudioMagicLinkQueueInput) {
      return database.$transaction(async transaction => {
        const parsedUser = studioUserSchema.safeParse(
          await transaction.user.findUnique({
            select: {id: true, role: true},
            where: {email: input.identifier},
          }),
        )
        const user = parsedUser.success ? parsedUser.data : null

        if (!user || !isStudioEditorRole(user.role)) {
          await transaction.auditEvent.create({
            data: {
              action: 'studio.magic-link.rejected',
              actorUserId: null,
              entityType: 'StudioSession',
              metadata: {identifierHash: input.identifierHash},
            },
          })

          return Object.freeze({accepted: false})
        }

        await transaction.verificationToken.create({
          data: input.verification,
        })
        await transaction.outboxJob.create({
          data: {
            idempotencyKey: `studio.magic-link:${input.verification.token}`,
            payload: {
              expiresAt: input.mail.expires.toISOString(),
              signInUrlEncrypted: input.mail.signInUrlEncrypted,
              to: input.identifier,
            },
            type: 'studio.magic-link.requested',
          },
        })
        await transaction.auditEvent.create({
          data: {
            action: 'studio.magic-link.requested',
            actorUserId: user.id,
            entityType: 'StudioSession',
            metadata: {expiresAt: input.verification.expires.toISOString()},
          },
        })

        return Object.freeze({accepted: true})
      })
    },
  })
}
