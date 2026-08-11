import {randomUUID} from 'node:crypto'

import {prisma} from '@/lib/db'
import {getRequiredAuthSecret} from '@/server/auth/request-context'
import {openStudioMagicLink} from '@/server/studio-auth/configured-magic-link'

import {getConfiguredMailer} from './configured-mailer'
import {
  createDatabaseOutboxStore,
  type OutboxDatabase,
} from './database-outbox-store'
import {createEngagementTokens} from './engagement-token'
import {createOutboxDispatcher} from './outbox-dispatcher'

const workerId = `web-${process.pid}-${randomUUID()}`

let configuredDispatcher:
  | ReturnType<typeof createOutboxDispatcher>
  | undefined

function getAppUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim()

  if (!configured) {
    throw new Error('OUTBOX_CONFIGURATION_INVALID')
  }

  return new URL(configured).origin
}

export function getConfiguredOutboxDispatcher() {
  const engagementTokens = createEngagementTokens(getRequiredAuthSecret())

  configuredDispatcher ??= createOutboxDispatcher(
    createDatabaseOutboxStore(prisma as unknown as OutboxDatabase),
    getConfiguredMailer(),
    {
      decrypt: engagementTokens.decrypt,
      openStudioMagicLink,
    },
    {appUrl: getAppUrl(), workerId},
  )

  return configuredDispatcher
}
