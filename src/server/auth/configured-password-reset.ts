import {hash} from 'bcryptjs'

import {prisma} from '@/lib/db'
import {getConfiguredAuthEmailOutbox} from '@/server/email/configured-auth-email-outbox'

import {
  createDatabasePasswordResetRepository,
  type PasswordResetTransaction,
} from './database-password-reset'
import {createPasswordResetService} from './password-reset'

const repository = createDatabasePasswordResetRepository({
  transaction: callback =>
    prisma.$transaction(transaction =>
      callback(transaction as unknown as PasswordResetTransaction),
    ),
})

let service: ReturnType<typeof createPasswordResetService> | undefined

export function getConfiguredPasswordResetService() {
  service ??= createPasswordResetService({
    consumeReset: repository.consumeReset,
    async deliverReset(input) {
      await getConfiguredAuthEmailOutbox().enqueuePasswordReset(input)
    },
    hashPassword: password => hash(password, 12),
    issueReset: repository.issueReset,
  })

  return service
}
