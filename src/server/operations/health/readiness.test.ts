import {describe, expect, it, vi} from 'vitest'

const {databaseQueryMock, headBucketMock} = vi.hoisted(() => ({
  databaseQueryMock: vi.fn(async () => [{'?column?': 1}]),
  headBucketMock: vi.fn(async () => ({})),
}))

vi.mock('../../../lib/db', () => ({
  prisma: {$queryRawUnsafe: databaseQueryMock},
}))

vi.mock('../../storage/object-storage', () => ({
  createConfiguredS3Client: () => ({send: headBucketMock}),
  parseObjectStorageConfiguration: (environment: typeof validEnvironment) => ({
    accessKeyId: environment.MEDIA_S3_ACCESS_KEY_ID,
    bucket: environment.MEDIA_S3_BUCKET,
    endpoint: environment.MEDIA_S3_ENDPOINT,
    forcePathStyle: true,
    region: environment.MEDIA_S3_REGION,
    secretAccessKey: environment.MEDIA_S3_SECRET_ACCESS_KEY,
  }),
}))

vi.mock('@aws-sdk/client-s3', () => ({
  HeadBucketCommand: class HeadBucketCommand {
    constructor(readonly input: Readonly<{Bucket: string}>) {}
  },
}))

import {
  checkReadiness,
  type ReadinessDependencies,
} from './readiness'

const validEnvironment = Object.freeze({
  AUTH_GOOGLE_ID: '123456789-example.apps.googleusercontent.com',
  AUTH_GOOGLE_SECRET: 'google-secret',
  AUTH_TRUST_PROXY: 'true',
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
  RESEND_WEBHOOK_SECRET: 'whsec_testsecret',
})

function dependencies(
  overrides: Partial<ReadinessDependencies> = {},
): ReadinessDependencies {
  return {
    checkDatabase: vi.fn(async () => undefined),
    checkObjectStorage: vi.fn(async () => undefined),
    validateEmailConfiguration: vi.fn(environment => {
      if (!environment.RESEND_API_KEY) throw new Error('invalid email config')
    }),
    ...overrides,
  }
}

describe('checkReadiness', () => {
  it('uses SELECT 1 and Garage HeadBucket in the production checks', async () => {
    databaseQueryMock.mockClear()
    headBucketMock.mockClear()

    const result = await checkReadiness({
      environment: validEnvironment,
      timeoutMs: 50,
    })

    expect(result.status).toBe('ready')
    expect(databaseQueryMock).toHaveBeenCalledWith('SELECT 1')
    expect(headBucketMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {Bucket: 'bekten-art-private-media'},
      }),
      expect.objectContaining({abortSignal: expect.any(AbortSignal)}),
    )
  })

  it('reports ready only after configuration, database and Garage checks pass', async () => {
    const result = await checkReadiness(
      {environment: validEnvironment, timeoutMs: 50},
      dependencies(),
    )

    expect(result).toEqual({
      checks: {
        configuration: 'ok',
        database: 'ok',
        email: 'ok',
        objectStorage: 'ok',
      },
      status: 'ready',
    })
  })

  it('fails closed and skips network checks for invalid production configuration', async () => {
    const deps = dependencies()

    const result = await checkReadiness(
      {environment: {}, timeoutMs: 50},
      deps,
    )

    expect(result).toEqual({
      checks: {
        configuration: 'error',
        database: 'skipped',
        email: 'error',
        objectStorage: 'skipped',
      },
      status: 'not_ready',
    })
    expect(deps.checkDatabase).not.toHaveBeenCalled()
    expect(deps.checkObjectStorage).not.toHaveBeenCalled()
  })

  it.each([
    ['database', {checkDatabase: async () => Promise.reject(new Error('secret database detail'))}],
    [
      'objectStorage',
      {
        checkObjectStorage: async () =>
          Promise.reject(new Error('Garage access key is invalid')),
      },
    ],
  ] as const)('reports a generic %s failure without leaking details', async (_name, override) => {
    const result = await checkReadiness(
      {environment: validEnvironment, timeoutMs: 50},
      dependencies(override),
    )

    expect(result.status).toBe('not_ready')
    expect(JSON.stringify(result)).not.toMatch(/secret|access key|garage/i)
  })

  it('times out slow dependencies and aborts their signals', async () => {
    let observedSignal: AbortSignal | undefined
    const neverFinishes = (signal: AbortSignal) => {
      observedSignal = signal

      return new Promise<void>(() => undefined)
    }

    const result = await checkReadiness(
      {environment: validEnvironment, timeoutMs: 10},
      dependencies({checkDatabase: neverFinishes}),
    )

    expect(result.checks.database).toBe('error')
    expect(result.status).toBe('not_ready')
    expect(observedSignal?.aborted).toBe(true)
  })

  it('validates Resend configuration locally without a provider request', async () => {
    const validateEmailConfiguration = vi.fn(() => undefined)
    const deps = dependencies({validateEmailConfiguration})

    await checkReadiness(
      {environment: validEnvironment, timeoutMs: 50},
      deps,
    )

    expect(validateEmailConfiguration).toHaveBeenCalledOnce()
    expect(validateEmailConfiguration).toHaveBeenCalledWith(validEnvironment)
  })
})
