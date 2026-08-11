import {prisma} from '@/lib/db'
import {getRequiredAuthSecret} from '@/server/auth/request-context'

import {createDatabaseStudioUserStore} from './database-studio-user-store'
import {createStudioUserService} from './studio-user-service'

function appUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim()

  if (!configured) throw new Error('STUDIO_USER_CONFIGURATION_INVALID')

  return new URL(configured).origin
}

let configured: ReturnType<typeof createStudioUserService> | undefined

export function getConfiguredStudioUsers() {
  configured ??= createStudioUserService(
    createDatabaseStudioUserStore(prisma as never, {
      appUrl: appUrl(),
      secret: getRequiredAuthSecret(),
    }),
  )

  return configured
}
