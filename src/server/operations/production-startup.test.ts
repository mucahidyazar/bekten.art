import {describe, expect, it} from 'vitest'

import {
  createProductionStartupPlan,
  validateProductionStartupEnvironment,
} from '../../../scripts/lib/production-startup.mjs'

const completeEnvironment = Object.freeze({
  AUTH_GOOGLE_ID: '123456789-example.apps.googleusercontent.com',
  AUTH_GOOGLE_SECRET: 'google-secret',
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
  RESEND_WEBHOOK_SECRET: 'whsec_testsecret',
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
      {
        arguments: ['migrate', 'deploy'],
        command: './node_modules/.bin/prisma',
        label: 'database migrations',
      },
      {
        arguments: ['server.js'],
        command: process.execPath,
        label: 'application server',
      },
    ])
  })

  it('gates the one-time typed and Garage cutover before the server starts', () => {
    const environment = {
      ...completeEnvironment,
      POCKETBASE_ADMIN_EMAIL: 'admin@example.com',
      POCKETBASE_ADMIN_PASSWORD: 'legacy-secret',
      POCKETBASE_STORAGE_COLLECTION: 'uploads',
      POCKETBASE_URL: 'https://pocketbase.example.com',
      RUN_LEGACY_CUTOVER: 'true',
    }

    expect(validateProductionStartupEnvironment(environment)).toBeUndefined()
    expect(
      createProductionStartupPlan(environment).map(step => step.label),
    ).toEqual([
      'database migrations',
      'typed content cutover',
      'Garage media cutover',
      'application server',
    ])
  })

  it('requires every legacy source credential only when cutover is enabled', () => {
    expect(() =>
      validateProductionStartupEnvironment({
        ...completeEnvironment,
        RUN_LEGACY_CUTOVER: 'true',
      }),
    ).toThrow(/POCKETBASE_URL/)
  })

  it('allows the one-time private HTTP legacy source only behind an explicit flag', () => {
    const privateLegacyEnvironment = {
      ...completeEnvironment,
      ALLOW_PRIVATE_HTTP_LEGACY_SOURCE: 'true',
      POCKETBASE_ADMIN_EMAIL: 'admin@example.com',
      POCKETBASE_ADMIN_PASSWORD: 'legacy-secret',
      POCKETBASE_STORAGE_COLLECTION: 'uploads',
      POCKETBASE_URL: 'http://192.168.50.130:45000/_/',
      RUN_LEGACY_CUTOVER: 'true',
    }

    expect(() =>
      validateProductionStartupEnvironment({
        ...privateLegacyEnvironment,
        ALLOW_PRIVATE_HTTP_LEGACY_SOURCE: 'false',
      }),
    ).toThrow(/POCKETBASE_URL/)
    expect(
      validateProductionStartupEnvironment(privateLegacyEnvironment),
    ).toBeUndefined()
  })

  it('fails before migration when provider configuration is superficially present but unsafe', () => {
    expect(() =>
      validateProductionStartupEnvironment({
        ...completeEnvironment,
        AUTH_GOOGLE_ID: 'not-a-google-client-id',
        MEDIA_S3_ENDPOINT: 'http://garage.internal/path',
        RESEND_API_KEY: 'not-a-resend-key',
        RESEND_FROM_EMAIL: 'not-an-email',
      }),
    ).toThrow(/MEDIA_S3_ENDPOINT.*AUTH_GOOGLE_ID.*RESEND_API_KEY.*RESEND_FROM_EMAIL/)
  })
})
