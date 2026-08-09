import {prisma} from '@/lib/db'
import {getRequiredAuthSecret} from '@/server/auth/request-context'

import {createAuthEmailOutbox, type AuthOutboxStore} from './auth-email-outbox'
import {createEngagementTokens} from './engagement-token'

let configured: ReturnType<typeof createAuthEmailOutbox> | undefined

export function getConfiguredAuthEmailOutbox() {
  configured ??= createAuthEmailOutbox(
    prisma.outboxJob as unknown as AuthOutboxStore,
    createEngagementTokens(getRequiredAuthSecret()),
  )

  return configured
}
