import {consumeConfiguredRateLimit} from '@/server/auth/configured-rate-limit'
import {
  getClientAddress,
  shouldTrustProxy,
} from '@/server/auth/request-context'

import {guardStudioMagicLinkRequest} from './request-boundary'

function configuredAppOrigin(request: Request) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim()

  if (configured) return new URL(configured).origin
  if (process.env.NODE_ENV !== 'production') return new URL(request.url).origin

  throw new Error('Studio authentication origin is not configured')
}

export function guardConfiguredStudioMagicLinkRequest(request: Request) {
  return guardStudioMagicLinkRequest(request, {
    appOrigin: configuredAppOrigin(request),
    consumeRateLimit: consumeConfiguredRateLimit,
    networkIdentifier: getClientAddress(request, shouldTrustProxy()),
  })
}
