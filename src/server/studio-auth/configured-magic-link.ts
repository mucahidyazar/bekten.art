import {prisma} from '@/lib/db'
import {getRequiredAuthSecret} from '@/server/auth/request-context'

import {createDatabaseStudioMagicLinkStore} from './database-store'
import {createStudioMagicLinkCoordinator} from './magic-link-coordinator'
import {createStudioMagicLinkSealer} from './sealed-link'

const secret = getRequiredAuthSecret()
const configuredAppUrl =
  process.env.NEXTAUTH_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim()

if (!configuredAppUrl && process.env.NODE_ENV === 'production') {
  throw new Error('Studio authentication origin is not configured')
}

const appOrigin = new URL(configuredAppUrl || 'http://localhost:3000').origin
const store = createDatabaseStudioMagicLinkStore({
  $transaction: callback =>
    prisma.$transaction(transaction =>
      callback({
        auditEvent: {
          create: args => transaction.auditEvent.create(args as never),
        },
        outboxJob: {
          create: args => transaction.outboxJob.create(args as never),
        },
        user: {
          findUnique: args => transaction.user.findUnique(args as never),
        },
        verificationToken: {
          create: args => transaction.verificationToken.create(args as never),
        },
      }),
    ),
})
const sealer = createStudioMagicLinkSealer(secret)

export const configuredStudioMagicLink = createStudioMagicLinkCoordinator({
  appOrigin,
  queue: store.queue,
  sealSignInUrl: sealer.seal,
  secret,
})

export const openStudioMagicLink = sealer.open
