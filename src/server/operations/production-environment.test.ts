import {describe, expect, it} from 'vitest'

import {validateProductionEnvironment} from './production-environment'

const validEnvironment = Object.freeze({
  AUTH_TRUST_PROXY: 'true',
  AUTH_GOOGLE_ID: '123456789-example.apps.googleusercontent.com',
  AUTH_GOOGLE_SECRET: 'google-secret',
  DATABASE_URL: 'postgresql://user:password@database:5432/bekten',
  MEDIA_S3_ACCESS_KEY_ID: 'garage-access-key',
  MEDIA_S3_BUCKET: 'bekten-art-private-media',
  MEDIA_S3_ENDPOINT: 'https://s3.garage.mucahid.dev',
  MEDIA_S3_FORCE_PATH_STYLE: 'true',
  MEDIA_S3_REGION: 'garage',
  MEDIA_S3_SECRET_ACCESS_KEY: 'garage-secret-key',
  NEXTAUTH_SECRET: 'a'.repeat(64),
  NEXTAUTH_URL: 'https://bekten.art',
  OUTBOX_DISPATCH_SECRET: 'o'.repeat(48),
  NEXT_PUBLIC_APP_URL: 'https://bekten.art',
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: 'G-ABC1234567',
  NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID: 'GTM-ABC1234',
  RESEND_API_KEY: 're_bekten_test_key',
  RESEND_FROM_EMAIL: 'noreply@mucahid.dev',
  RESEND_REPLY_TO: 'support@mucahid.dev',
  RESEND_WEBHOOK_SECRET: 'whsec_base64/secret+value==',
})

describe('validateProductionEnvironment', () => {
  it('accepts a complete production contract', () => {
    expect(validateProductionEnvironment(validEnvironment)).toEqual({
      issues: [],
      ok: true,
    })
  })

  it('reports every missing production boundary without exposing values', () => {
    const result = validateProductionEnvironment({})

    expect(result.ok).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'DATABASE_URL is required',
        'NEXT_PUBLIC_APP_URL must be a public HTTPS URL',
        'NEXTAUTH_SECRET must contain at least 32 characters',
        'OUTBOX_DISPATCH_SECRET must contain at least 32 characters',
        'MEDIA_S3_BUCKET is required',
        'RESEND_API_KEY must be a valid Resend API key',
      ]),
    )
    expect(JSON.stringify(result)).not.toContain('password')
  })

  it('requires Garage path-style addressing', () => {
    const result = validateProductionEnvironment({
      ...validEnvironment,
      MEDIA_S3_FORCE_PATH_STYLE: 'false',
    })

    expect(result.issues).toContain(
      'MEDIA_S3_FORCE_PATH_STYLE must be true for Garage',
    )
  })

  it('requires the auth and public origins to match', () => {
    const result = validateProductionEnvironment({
      ...validEnvironment,
      NEXTAUTH_URL: 'https://admin.bekten.art',
    })

    expect(result.issues).toContain(
      'NEXTAUTH_URL must match NEXT_PUBLIC_APP_URL',
    )
  })

  it('requires the explicitly trusted Coolify proxy boundary', () => {
    const result = validateProductionEnvironment({
      ...validEnvironment,
      AUTH_TRUST_PROXY: 'false',
    })

    expect(result.issues).toContain(
      'AUTH_TRUST_PROXY must be true behind the production reverse proxy',
    )
  })

  it('allows GA4 to be managed in GTM while rejecting an invalid direct ID', () => {
    expect(
      validateProductionEnvironment({
        ...validEnvironment,
        NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: undefined,
      }).issues,
    ).not.toContain(
      'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID must be a valid GA4 measurement ID',
    )
    expect(
      validateProductionEnvironment({
        ...validEnvironment,
        NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: 'UA-LEGACY',
      }).issues,
    ).toContain(
      'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID must be a valid GA4 measurement ID',
    )
  })
})
