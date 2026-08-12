import {readFileSync} from 'node:fs'

import {describe, expect, it} from 'vitest'

import {
  createProductionStartupPlan,
  validateProductionStartupEnvironment,
} from '../../../scripts/lib/production-startup.mjs'

const completeEnvironment = Object.freeze({
  AUTH_TRUST_PROXY: 'true',
  DATABASE_URL: 'postgresql://app:secret@database:5432/app',
  MEDIA_S3_ACCESS_KEY_ID: 'garage-key',
  MEDIA_S3_BUCKET: 'bekten-art-private-media',
  MEDIA_S3_ENDPOINT: 'https://s3.mucahid.dev',
  MEDIA_S3_FORCE_PATH_STYLE: 'true',
  MEDIA_S3_REGION: 'garage',
  MEDIA_S3_SECRET_ACCESS_KEY: 'garage-secret',
  NEXTAUTH_SECRET: 'n'.repeat(48),
  NEXTAUTH_URL: 'https://bekten.art',
  NEXT_PUBLIC_APP_URL: 'https://bekten.art',
  NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID: 'GTM-TEST123',
  OUTBOX_DISPATCH_SECRET: 'o'.repeat(48),
  RESEND_API_KEY: 're_test_key',
  RESEND_FROM_EMAIL: 'noreply@mucahid.dev',
  RESEND_REPLY_TO: 'support@mucahid.dev',
  RESEND_WEBHOOK_SECRET: 'whsec_base64/secret+value==',
})

const productionDockerfile = readFileSync('Dockerfile.prod', 'utf8')

const migrationStep = Object.freeze({
  arguments: [
    'migrate',
    'deploy',
    '--config',
    './scripts/migration-runtime/prisma.config.ts',
  ],
  command: './scripts/migration-runtime/node_modules/.bin/prisma',
  label: 'database migrations',
})

const preflightStep = Object.freeze({
  arguments: ['scripts/preflight-v2-cutover.mjs'],
  command: process.execPath,
  label: 'v2 cutover preflight',
})

describe('production startup contract', () => {
  it('fails fast with secret-free field names when required configuration is missing', () => {
    expect(() => validateProductionStartupEnvironment({})).toThrow(
      /DATABASE_URL, NEXT_PUBLIC_APP_URL/,
    )
    expect(() => validateProductionStartupEnvironment({})).not.toThrow(
      /postgresql:\/\//,
    )
  })

  it('starts the server only after migrations in the steady state', () => {
    expect(
      validateProductionStartupEnvironment(completeEnvironment),
    ).toBeUndefined()
    expect(createProductionStartupPlan(completeEnvironment)).toEqual([
      preflightStep,
      migrationStep,
      {
        arguments: ['server.js'],
        command: process.execPath,
        label: 'application server',
      },
    ])
  })

  it('never schedules a removed legacy storage cutover', () => {
    const environmentWithStaleLegacyFlags = {
      ...completeEnvironment,
      REMOVED_STORAGE_CUTOVER: 'true',
      REMOVED_STORAGE_URL: 'http://192.168.50.130:45000/',
    }

    expect(
      validateProductionStartupEnvironment(environmentWithStaleLegacyFlags),
    ).toBeUndefined()
    expect(
      createProductionStartupPlan(environmentWithStaleLegacyFlags),
    ).toEqual([
      preflightStep,
      migrationStep,
      {
        arguments: ['server.js'],
        command: process.execPath,
        label: 'application server',
      },
    ])
  })

  it('fails before migration when provider configuration is superficially present but unsafe', () => {
    expect(() =>
      validateProductionStartupEnvironment({
        ...completeEnvironment,
        MEDIA_S3_ENDPOINT: 'http://garage.internal/path',
        RESEND_API_KEY: 'not-a-resend-key',
        RESEND_FROM_EMAIL: 'not-an-email',
      }),
    ).toThrow(/MEDIA_S3_ENDPOINT.*RESEND_API_KEY.*RESEND_FROM_EMAIL/)
  })

  it('accepts URL-safe base64 Svix webhook signing secrets at startup', () => {
    expect(() =>
      validateProductionStartupEnvironment({
        ...completeEnvironment,
        RESEND_WEBHOOK_SECRET: 'whsec_base64url-secret_value',
      }),
    ).not.toThrow()
  })

  it('ships an isolated migration runtime instead of the full development dependency tree', () => {
    expect(productionDockerfile).toContain('FROM base AS migration-runtime')
    expect(productionDockerfile).toContain(
      'COPY --from=migration-runtime --chown=nextjs:nodejs /migration-runtime ./scripts/migration-runtime',
    )
    expect(productionDockerfile).toContain(
      'COPY --from=builder --chown=nextjs:nodejs /app/scripts/preflight-v2-cutover.mjs ./scripts/preflight-v2-cutover.mjs',
    )
    expect(productionDockerfile).not.toContain(
      'COPY --from=dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules',
    )
  })

  it('shares a locked pnpm cache across production build stages', () => {
    const cachedInstallSteps = productionDockerfile.match(
      /RUN --mount=type=cache,id=bekten-pnpm-store,target=\/pnpm\/store,sharing=locked/gu,
    )

    expect(cachedInstallSteps).toHaveLength(3)
    expect(productionDockerfile).toContain('ENV PNPM_STORE_DIR=/pnpm/store')
  })
})
