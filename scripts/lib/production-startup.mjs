const BASE_REQUIRED = Object.freeze([
  'DATABASE_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'AUTH_TRUST_PROXY',
  'AUTH_GOOGLE_ID',
  'AUTH_GOOGLE_SECRET',
  'NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID',
  'MEDIA_S3_BUCKET',
  'MEDIA_S3_REGION',
  'MEDIA_S3_ENDPOINT',
  'MEDIA_S3_FORCE_PATH_STYLE',
  'MEDIA_S3_ACCESS_KEY_ID',
  'MEDIA_S3_SECRET_ACCESS_KEY',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'RESEND_REPLY_TO',
  'RESEND_WEBHOOK_SECRET',
  'OUTBOX_DISPATCH_SECRET',
])

function value(environment, name) {
  const candidate = environment[name]

  return typeof candidate === 'string' ? candidate.trim() : ''
}

function validatedHttpsOrigin(environment, name, errors) {
  try {
    const parsed = new URL(value(environment, name))

    if (
      parsed.protocol !== 'https:' ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    ) {
      errors.push(name)
    }

    return parsed.origin
  } catch {
    errors.push(name)

    return null
  }
}

export function createProductionStartupPlan(_environment) {
  const migrationPlan = [
    Object.freeze({
      arguments: ['migrate', 'deploy'],
      command: './node_modules/.bin/prisma',
      label: 'database migrations',
    }),
  ]
  const serverPlan = [
    Object.freeze({
      arguments: ['server.js'],
      command: process.execPath,
      label: 'application server',
    }),
  ]

  return Object.freeze([...migrationPlan, ...serverPlan])
}

export function validateProductionStartupEnvironment(environment) {
  const errors = BASE_REQUIRED.filter(name => !value(environment, name))
  const appOrigin = validatedHttpsOrigin(
    environment,
    'NEXT_PUBLIC_APP_URL',
    errors,
  )
  const authOrigin = validatedHttpsOrigin(environment, 'NEXTAUTH_URL', errors)

  if (appOrigin && authOrigin && appOrigin !== authOrigin) {
    errors.push('NEXTAUTH_URL')
  }

  if (!/^postgres(?:ql)?:\/\//u.test(value(environment, 'DATABASE_URL'))) {
    errors.push('DATABASE_URL')
  }

  if (value(environment, 'NEXTAUTH_SECRET').length < 32) {
    errors.push('NEXTAUTH_SECRET')
  }

  if (value(environment, 'OUTBOX_DISPATCH_SECRET').length < 32) {
    errors.push('OUTBOX_DISPATCH_SECRET')
  }

  if (value(environment, 'AUTH_TRUST_PROXY') !== 'true') {
    errors.push('AUTH_TRUST_PROXY')
  }

  if (value(environment, 'MEDIA_S3_FORCE_PATH_STYLE') !== 'true') {
    errors.push('MEDIA_S3_FORCE_PATH_STYLE')
  }

  validatedHttpsOrigin(environment, 'MEDIA_S3_ENDPOINT', errors)

  if (
    !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/u.test(
      value(environment, 'MEDIA_S3_BUCKET'),
    ) ||
    value(environment, 'MEDIA_S3_BUCKET').includes('..')
  ) {
    errors.push('MEDIA_S3_BUCKET')
  }

  if (
    !/^[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/u.test(
      value(environment, 'AUTH_GOOGLE_ID'),
    )
  ) {
    errors.push('AUTH_GOOGLE_ID')
  }

  if (!/^re_[A-Za-z0-9_-]{3,}$/u.test(value(environment, 'RESEND_API_KEY'))) {
    errors.push('RESEND_API_KEY')
  }

  for (const name of ['RESEND_FROM_EMAIL', 'RESEND_REPLY_TO']) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value(environment, name))) {
      errors.push(name)
    }
  }

  if (
    !/^whsec_[A-Za-z0-9_-]{8,}$/u.test(
      value(environment, 'RESEND_WEBHOOK_SECRET'),
    )
  ) {
    errors.push('RESEND_WEBHOOK_SECRET')
  }

  if (
    !/^GTM-[A-Z0-9]+$/u.test(
      value(environment, 'NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID'),
    )
  ) {
    errors.push('NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID')
  }

  const uniqueErrors = [...new Set(errors)]

  if (uniqueErrors.length > 0) {
    throw new Error(
      `Production configuration is invalid: ${uniqueErrors.join(', ')}`,
    )
  }
}
