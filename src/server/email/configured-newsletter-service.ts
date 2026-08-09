import {prisma} from '@/lib/db'
import {getRequiredAuthSecret} from '@/server/auth/request-context'

import {
  createDatabaseNewsletterStore,
  type NewsletterDatabase,
} from './database-newsletter-store'
import {createEngagementTokens} from './engagement-token'
import {createNewsletterService} from './newsletter-service'

let configuredService:
  | ReturnType<typeof createNewsletterService>
  | undefined

export function getConfiguredNewsletterService() {
  configuredService ??= createNewsletterService(
    createDatabaseNewsletterStore(
      prisma as unknown as NewsletterDatabase,
    ),
    createEngagementTokens(getRequiredAuthSecret()),
  )

  return configuredService
}
