import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'

import {describe, expect, it} from 'vitest'

const expectedVariables = [
  'ALLOW_DASHBOARD_EDITOR_UPSERT',
  'ALLOW_V2_DEMO_SEED',
  'APIFY_ACTOR_ID',
  'APIFY_INSTAGRAM_USERNAME',
  'APIFY_RESULTS_LIMIT',
  'APIFY_TOKEN',
  'AUTH_TRUST_PROXY',
  'DASHBOARD_EDITOR_EMAIL',
  'DASHBOARD_EDITOR_UPSERT_CONFIRMATION',
  'DATABASE_URL',
  'GOOGLE_SITE_VERIFICATION',
  'MEDIA_S3_ACCESS_KEY_ID',
  'MEDIA_S3_BUCKET',
  'MEDIA_S3_ENDPOINT',
  'MEDIA_S3_FORCE_PATH_STYLE',
  'MEDIA_S3_REGION',
  'MEDIA_S3_SECRET_ACCESS_KEY',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID',
  'NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID',
  'OUTBOX_DISPATCH_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'RESEND_REPLY_TO',
  'RESEND_WEBHOOK_SECRET',
  'V2_DEMO_SEED_CONFIRMATION',
] as const

const sensitiveVariables = [
  'APIFY_TOKEN',
  'DATABASE_URL',
  'MEDIA_S3_ACCESS_KEY_ID',
  'MEDIA_S3_SECRET_ACCESS_KEY',
  'NEXTAUTH_SECRET',
  'OUTBOX_DISPATCH_SECRET',
  'RESEND_API_KEY',
  'RESEND_WEBHOOK_SECRET',
] as const

function exampleEnvironment() {
  const source = readFileSync(join(process.cwd(), '.env.example'), 'utf8')

  return Object.fromEntries(
    source
      .split(/\r?\n/u)
      .map(line => line.trim())
      .filter(line => /^[A-Z][A-Z0-9_]*=/u.test(line))
      .map(line => {
        const separator = line.indexOf('=')
        const name = line.slice(0, separator)
        const value = line.slice(separator + 1).replace(/^"|"$/gu, '')

        return [name, value]
      }),
  )
}

function readRuntimeEnvironment(environment: NodeJS.ProcessEnv) {
  const envModule = pathToFileURL(join(process.cwd(), 'src/configs/env.mjs'))
  const evaluation = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `const {env} = await import(${JSON.stringify(envModule.href)}); process.stdout.write(JSON.stringify({allow: env.ALLOW_DASHBOARD_EDITOR_UPSERT, confirmation: env.DASHBOARD_EDITOR_UPSERT_CONFIRMATION, demo: env.ALLOW_V2_DEMO_SEED, email: env.DASHBOARD_EDITOR_EMAIL, limit: env.APIFY_RESULTS_LIMIT}));`,
    ],
    {
      encoding: 'utf8',
      env: environment,
    },
  )

  return evaluation
}

describe('environment contract', () => {
  it('documents every runtime and operator variable without committing secrets', () => {
    const example = exampleEnvironment()

    expect(Object.keys(example)).toEqual(
      expect.arrayContaining([...expectedVariables]),
    )
    for (const name of sensitiveVariables) expect(example[name]).toBe('')
    expect(example.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000')
    expect(example.NEXTAUTH_URL).toBe('http://localhost:3000')
    expect(example.DASHBOARD_EDITOR_EMAIL).toBe('mucahidyazar@gmail.com')
    expect(example.ALLOW_DASHBOARD_EDITOR_UPSERT).toBe('false')
  })

  it('validates and exposes operator-only configuration', async () => {
    const evaluation = readRuntimeEnvironment({
      ...process.env,
      ALLOW_DASHBOARD_EDITOR_UPSERT: 'false',
      ALLOW_V2_DEMO_SEED: 'false',
      APIFY_RESULTS_LIMIT: '60',
      DASHBOARD_EDITOR_EMAIL: 'mucahidyazar@gmail.com',
      DASHBOARD_EDITOR_UPSERT_CONFIRMATION:
        'grant-editor:mucahidyazar@gmail.com',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID: 'GTM-LOCAL123',
    })

    expect(evaluation.status).toBe(0)
    expect(JSON.parse(evaluation.stdout)).toEqual({
      allow: 'false',
      confirmation:
      'grant-editor:mucahidyazar@gmail.com',
      demo: 'false',
      email: 'mucahidyazar@gmail.com',
      limit: '60',
    })
  })

  it('rejects an invalid configured dashboard editor email', async () => {
    const evaluation = readRuntimeEnvironment({
      ...process.env,
      DASHBOARD_EDITOR_EMAIL: 'not-an-email',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID: 'GTM-LOCAL123',
    })

    expect(evaluation.status).not.toBe(0)
    expect(evaluation.stderr).toMatch(/DASHBOARD_EDITOR_EMAIL/u)
  })
})
