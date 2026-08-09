import {validateProductionEnvironment} from '../production-environment'

const DEFAULT_TIMEOUT_MS = 2_500

type Environment = Readonly<Record<string, string | undefined>>
type CheckStatus = 'error' | 'ok' | 'skipped'

export type ReadinessDependencies = Readonly<{
  checkDatabase: (signal: AbortSignal) => Promise<void>
  checkObjectStorage: (
    signal: AbortSignal,
    environment: Environment,
  ) => Promise<void>
  validateEmailConfiguration: (environment: Environment) => void
}>

export type ReadinessResult = Readonly<{
  checks: Readonly<{
    configuration: CheckStatus
    database: CheckStatus
    email: CheckStatus
    objectStorage: CheckStatus
  }>
  status: 'not_ready' | 'ready'
}>

export async function checkReadiness(
  options: Readonly<{
    environment?: Environment
    timeoutMs?: number
  }> = {},
  dependencies: ReadinessDependencies = productionReadinessDependencies,
): Promise<ReadinessResult> {
  const environment = options.environment ?? process.env
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const configuration = validateProductionEnvironment(environment).ok
    ? 'ok'
    : 'error'
  const email = validateEmail(dependencies, environment)

  if (configuration === 'error') {
    return {
      checks: {
        configuration,
        database: 'skipped',
        email,
        objectStorage: 'skipped',
      },
      status: 'not_ready',
    }
  }

  const [database, objectStorage] = await Promise.all([
    runTimedCheck(signal => dependencies.checkDatabase(signal), timeoutMs),
    runTimedCheck(
      signal => dependencies.checkObjectStorage(signal, environment),
      timeoutMs,
    ),
  ])
  const ready =
    configuration === 'ok' &&
    database === 'ok' &&
    email === 'ok' &&
    objectStorage === 'ok'

  return {
    checks: {configuration, database, email, objectStorage},
    status: ready ? 'ready' : 'not_ready',
  }
}

async function checkDatabase(): Promise<void> {
  const {prisma} = await import('../../../lib/db')

  await prisma.$queryRawUnsafe('SELECT 1')
}

async function checkObjectStorage(
  signal: AbortSignal,
  environment: Environment,
): Promise<void> {
  const [{HeadBucketCommand}, storage] = await Promise.all([
    import('@aws-sdk/client-s3'),
    import('../../storage/object-storage'),
  ])
  const configuration = storage.parseObjectStorageConfiguration(environment)
  const client = storage.createConfiguredS3Client(configuration)

  await client.send(
    new HeadBucketCommand({Bucket: configuration.bucket}),
    {abortSignal: signal},
  )
}

function validateEmailConfiguration(environment: Environment) {
  const apiKey = environment.RESEND_API_KEY?.trim() ?? ''
  const from = environment.RESEND_FROM_EMAIL?.trim() ?? ''
  const replyTo = environment.RESEND_REPLY_TO?.trim() ?? ''
  const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/

  if (
    !/^re_[A-Za-z0-9_-]+$/.test(apiKey) ||
    !emailPattern.test(from) ||
    !emailPattern.test(replyTo)
  ) {
    throw new Error('EMAIL_CONFIGURATION_INVALID')
  }
}

const productionReadinessDependencies: ReadinessDependencies = {
  checkDatabase,
  checkObjectStorage,
  validateEmailConfiguration,
}

function validateEmail(
  dependencies: ReadinessDependencies,
  environment: Environment,
): CheckStatus {
  try {
    dependencies.validateEmailConfiguration(environment)

    return 'ok'
  } catch {
    return 'error'
  }
}

async function runTimedCheck(
  check: (signal: AbortSignal) => Promise<void>,
  timeoutMs: number,
): Promise<CheckStatus> {
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) return 'error'

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    await waitForAbort(check(controller.signal), controller.signal)

    return 'ok'
  } catch {
    return 'error'
  } finally {
    clearTimeout(timeoutId)
  }
}

function waitForAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(new Error('HEALTH_CHECK_TIMEOUT'))

  return new Promise((resolve, reject) => {
    const abort = () => reject(new Error('HEALTH_CHECK_TIMEOUT'))

    signal.addEventListener('abort', abort, {once: true})
    promise.then(
      value => {
        signal.removeEventListener('abort', abort)
        resolve(value)
      },
      error => {
        signal.removeEventListener('abort', abort)
        reject(error)
      },
    )
  })
}
