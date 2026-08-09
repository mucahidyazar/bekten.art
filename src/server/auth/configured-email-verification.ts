import {hash} from 'bcryptjs'

import {prisma} from '@/lib/db'
import {getConfiguredAuthEmailOutbox} from '@/server/email/configured-auth-email-outbox'

import {
  createDatabaseEmailVerificationRepository,
  type VerificationTransaction,
} from './database-email-verification'
import {createEmailVerificationService} from './email-verification'

const repository = createDatabaseEmailVerificationRepository({
  transaction: callback =>
    prisma.$transaction(transaction =>
      callback(transaction as unknown as VerificationTransaction),
    ),
})

let service: ReturnType<typeof createEmailVerificationService> | undefined

export function getConfiguredEmailVerificationService() {
  service ??= createEmailVerificationService({
    async deliverVerification(input) {
      await getConfiguredAuthEmailOutbox().enqueueVerification(input)
    },
    hashPassword: password => hash(password, 12),
    issueVerification: repository.issueVerification,
    verifyToken: repository.verifyToken,
  })

  return service
}
