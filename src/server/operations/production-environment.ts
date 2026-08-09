type Environment = Readonly<Record<string, string | undefined>>

export type ProductionEnvironmentValidation = Readonly<{
  issues: readonly string[]
  ok: boolean
}>

function value(environment: Environment, key: string) {
  return environment[key]?.trim() ?? ''
}

function required(environment: Environment, key: string) {
  return value(environment, key) ? null : `${key} is required`
}

function parsedUrl(environment: Environment, key: string) {
  try {
    return new URL(value(environment, key))
  } catch {
    return null
  }
}

function databaseUrlIssue(environment: Environment) {
  const configured = value(environment, 'DATABASE_URL')

  if (!configured) {
    return 'DATABASE_URL is required'
  }

  const url = parsedUrl(environment, 'DATABASE_URL')

  return url &&
    (url.protocol === 'postgres:' || url.protocol === 'postgresql:') &&
    url.hostname &&
    url.pathname.length > 1
    ? null
    : 'DATABASE_URL must be a valid PostgreSQL URL'
}

function publicAppUrlIssue(environment: Environment) {
  const url = parsedUrl(environment, 'NEXT_PUBLIC_APP_URL')
  const privateHostname =
    !url ||
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname.endsWith('.local')

  return url?.protocol === 'https:' && !privateHostname
    ? null
    : 'NEXT_PUBLIC_APP_URL must be a public HTTPS URL'
}

function nextAuthUrlIssue(environment: Environment) {
  const appUrl = parsedUrl(environment, 'NEXT_PUBLIC_APP_URL')
  const nextAuthUrl = parsedUrl(environment, 'NEXTAUTH_URL')

  return nextAuthUrl?.origin === appUrl?.origin
    ? null
    : 'NEXTAUTH_URL must match NEXT_PUBLIC_APP_URL'
}

function secretLength(environment: Environment, key: string) {
  return value(environment, key).length >= 32
    ? null
    : `${key} must contain at least 32 characters`
}

function resendApiKeyIssue(environment: Environment) {
  return /^re_[A-Za-z0-9_-]{3,}$/u.test(value(environment, 'RESEND_API_KEY'))
    ? null
    : 'RESEND_API_KEY must be a valid Resend API key'
}

function resendWebhookSecretIssue(environment: Environment) {
  return /^whsec_[A-Za-z0-9+/]{8,}={0,2}$/u.test(
    value(environment, 'RESEND_WEBHOOK_SECRET'),
  )
    ? null
    : 'RESEND_WEBHOOK_SECRET must be a valid Resend signing secret'
}

function googleClientIdIssue(environment: Environment) {
  return /^[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/u.test(
    value(environment, 'AUTH_GOOGLE_ID'),
  )
    ? null
    : 'AUTH_GOOGLE_ID must be a valid Google OAuth client ID'
}

function tagManagerIssue(environment: Environment) {
  return /^GTM-[A-Z0-9]+$/u.test(
    value(environment, 'NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID'),
  )
    ? null
    : 'NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID must be a valid GTM container ID'
}

function analyticsIssue(environment: Environment) {
  const measurementId = value(environment, 'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID')

  return !measurementId || /^G-[A-Z0-9]+$/u.test(measurementId)
    ? null
    : 'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID must be a valid GA4 measurement ID'
}

function emailAddressIssue(environment: Environment, key: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value(environment, key))
    ? null
    : `${key} must be a valid email address`
}

function garagePathStyleIssue(environment: Environment) {
  return value(environment, 'MEDIA_S3_FORCE_PATH_STYLE') === 'true'
    ? null
    : 'MEDIA_S3_FORCE_PATH_STYLE must be true for Garage'
}

function trustedProxyIssue(environment: Environment) {
  return value(environment, 'AUTH_TRUST_PROXY') === 'true'
    ? null
    : 'AUTH_TRUST_PROXY must be true behind the production reverse proxy'
}

export function validateProductionEnvironment(
  environment: Environment,
): ProductionEnvironmentValidation {
  const issues = [
    databaseUrlIssue(environment),
    publicAppUrlIssue(environment),
    nextAuthUrlIssue(environment),
    secretLength(environment, 'NEXTAUTH_SECRET'),
    secretLength(environment, 'OUTBOX_DISPATCH_SECRET'),
    trustedProxyIssue(environment),
    googleClientIdIssue(environment),
    required(environment, 'AUTH_GOOGLE_SECRET'),
    required(environment, 'MEDIA_S3_BUCKET'),
    required(environment, 'MEDIA_S3_REGION'),
    required(environment, 'MEDIA_S3_ENDPOINT'),
    garagePathStyleIssue(environment),
    required(environment, 'MEDIA_S3_ACCESS_KEY_ID'),
    required(environment, 'MEDIA_S3_SECRET_ACCESS_KEY'),
    resendApiKeyIssue(environment),
    emailAddressIssue(environment, 'RESEND_FROM_EMAIL'),
    emailAddressIssue(environment, 'RESEND_REPLY_TO'),
    resendWebhookSecretIssue(environment),
    analyticsIssue(environment),
    tagManagerIssue(environment),
  ].filter(Boolean) as string[]

  return {
    issues,
    ok: issues.length === 0,
  }
}
