export const CONSENT_STORAGE_KEY = 'bekten.consent.v1'
export const CONSENT_VERSION = 1 as const

export type ConsentDecision = {
  analytics: boolean
  externalMedia: boolean
  marketing: boolean
  savedAt: string
  version: typeof CONSENT_VERSION
}

export type GoogleConsentState = {
  ad_personalization: 'denied' | 'granted'
  ad_storage: 'denied' | 'granted'
  ad_user_data: 'denied' | 'granted'
  analytics_storage: 'denied' | 'granted'
  functionality_storage: 'denied' | 'granted'
  personalization_storage: 'denied' | 'granted'
  security_storage: 'granted'
}

export function createConsentDecision(
  analytics: boolean,
  marketing: boolean,
  externalMedia: boolean,
): ConsentDecision {
  return {
    analytics,
    externalMedia,
    marketing,
    savedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  }
}

export function parseStoredConsent(value: string | null): ConsentDecision | null {
  if (!value) return null

  try {
    const parsed: unknown = JSON.parse(value)

    if (!isConsentDecision(parsed)) return null

    return parsed
  } catch {
    return null
  }
}

export function toGoogleConsentState(
  decision: ConsentDecision,
): GoogleConsentState {
  return {
    ad_personalization: decision.marketing ? 'granted' : 'denied',
    ad_storage: decision.marketing ? 'granted' : 'denied',
    ad_user_data: decision.marketing ? 'granted' : 'denied',
    analytics_storage: decision.analytics ? 'granted' : 'denied',
    functionality_storage: decision.externalMedia ? 'granted' : 'denied',
    personalization_storage: decision.marketing ? 'granted' : 'denied',
    security_storage: 'granted',
  }
}

function isConsentDecision(value: unknown): value is ConsentDecision {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<ConsentDecision>

  return (
    candidate.version === CONSENT_VERSION &&
    typeof candidate.analytics === 'boolean' &&
    typeof candidate.marketing === 'boolean' &&
    typeof candidate.externalMedia === 'boolean' &&
    typeof candidate.savedAt === 'string' &&
    !Number.isNaN(Date.parse(candidate.savedAt))
  )
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}
