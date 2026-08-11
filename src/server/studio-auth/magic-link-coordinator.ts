import {createHash, createHmac} from 'node:crypto'

import {z} from 'zod'

const verificationTokenSchema = z.object({
  expires: z.date(),
  identifier: z.string(),
  token: z.string().regex(/^[a-f0-9]{64}$/u),
})
const mailSchema = z.object({
  expires: z.date(),
  identifier: z.string(),
  token: z.string().min(20).max(512),
  url: z.string().url().max(4_096),
})
const emailSchema = z.email().max(254)

export type StudioMagicLinkQueueInput = Readonly<{
  identifier: string
  identifierHash: string
  mail: Readonly<{
    expires: Date
    signInUrlEncrypted: string
  }>
  verification: StudioVerificationToken
}>

export type StudioVerificationToken = z.infer<typeof verificationTokenSchema>

type StudioMagicLinkCoordinatorDependencies = Readonly<{
  appOrigin: string
  minimumDurationMs?: number
  monotonicNow?: () => number
  pairingTimeoutMs?: number
  pause?: (milliseconds: number) => Promise<void>
  queue: (
    input: StudioMagicLinkQueueInput,
  ) => Promise<Readonly<{accepted: boolean}>>
  sealSignInUrl: (url: string) => string
  secret: string
}>

type PendingMail = z.infer<typeof mailSchema>

type PendingEntry = Readonly<{
  mail?: PendingMail
  mailPromise?: Readonly<{
    reject: (reason: unknown) => void
    resolve: () => void
  }>
  processing?: boolean
  startedAt: number
  timeout: ReturnType<typeof setTimeout>
  token?: StudioVerificationToken
  tokenPromise?: Readonly<{
    reject: (reason: unknown) => void
    resolve: (token: StudioVerificationToken) => void
  }>
}>

export function createStudioMagicLinkCoordinator(
  dependencies: StudioMagicLinkCoordinatorDependencies,
) {
  const secret = dependencies.secret

  if (secret.length < 32) {
    throw new Error('Studio authentication secret must contain 32+ characters')
  }

  const minimumDurationMs = dependencies.minimumDurationMs ?? 150
  const pairingTimeoutMs = dependencies.pairingTimeoutMs ?? 5_000
  const monotonicNow = dependencies.monotonicNow ?? (() => performance.now())
  const pause = dependencies.pause ?? defaultPause
  const pending = new Map<string, PendingEntry>()
  const appUrl = new URL(dependencies.appOrigin)
  const appOrigin = appUrl.origin

  if (
    !['http:', 'https:'].includes(appUrl.protocol) ||
    !Number.isInteger(pairingTimeoutMs) ||
    pairingTimeoutMs < 100 ||
    pairingTimeoutMs > 30_000
  ) {
    throw new Error('Studio authentication coordinator is misconfigured')
  }

  function removePending(key: string) {
    const entry = pending.get(key)

    if (entry) clearTimeout(entry.timeout)
    pending.delete(key)

    return entry
  }

  function fail(key: string, error: unknown) {
    const entry = removePending(key)

    entry?.mailPromise?.reject(error)
    entry?.tokenPromise?.reject(error)
  }

  function pairingTimeout(key: string) {
    return setTimeout(
      () => fail(key, new Error('Studio verification pairing timed out')),
      pairingTimeoutMs,
    )
  }

  function flush(key: string) {
    const entry = pending.get(key)
    const mail = entry?.mail
    const token = entry?.token

    if (!entry || !mail || !token || entry.processing) return

    pending.set(key, {...entry, processing: true})

    void (async () => {
      try {
        const identifier = normalizeStudioEmail(mail.identifier)

        if (identifier !== normalizeStudioEmail(token.identifier)) {
          throw new Error('Studio verification request mismatch')
        }

        const signInUrl = new URL(mail.url)
        const tokenInUrl = signInUrl.searchParams.get('token')

        if (
          signInUrl.origin !== appOrigin ||
          signInUrl.pathname !== '/api/auth/callback/email' ||
          mail.expires.getTime() !== token.expires.getTime() ||
          !tokenInUrl ||
          hashStudioVerificationToken(tokenInUrl, secret) !== token.token
        ) {
          throw new Error('Studio verification URL mismatch')
        }

        const signInUrlEncrypted = dependencies.sealSignInUrl(mail.url)

        await dependencies.queue({
          identifier,
          identifierHash: identifierHash(identifier, secret),
          mail: {
            expires: new Date(mail.expires),
            signInUrlEncrypted,
          },
          verification: {
            ...token,
            expires: new Date(token.expires),
            identifier,
          },
        })

        const elapsed = monotonicNow() - entry.startedAt

        if (elapsed < minimumDurationMs) {
          await pause(minimumDurationMs - elapsed)
        }

        removePending(key)
        entry.mailPromise?.resolve()
        entry.tokenPromise?.resolve(token)
      } catch (error) {
        fail(key, error)
      }
    })()
  }

  function queueMail(input: PendingMail) {
    const mail = mailSchema.parse(input)
    const key = hashStudioVerificationToken(mail.token, secret)

    return new Promise<void>((resolve, reject) => {
      const current = pending.get(key)

      pending.set(key, {
        ...current,
        mail,
        mailPromise: {reject, resolve},
        startedAt: current?.startedAt ?? monotonicNow(),
        timeout: current?.timeout ?? pairingTimeout(key),
      })
      flush(key)
    })
  }

  function storeVerificationToken(input: StudioVerificationToken) {
    const token = verificationTokenSchema.parse(input)

    return new Promise<StudioVerificationToken>((resolve, reject) => {
      const current = pending.get(token.token)

      pending.set(token.token, {
        ...current,
        startedAt: current?.startedAt ?? monotonicNow(),
        token,
        tokenPromise: {reject, resolve},
        timeout: current?.timeout ?? pairingTimeout(token.token),
      })
      flush(token.token)
    })
  }

  return Object.freeze({
    normalizeIdentifier: normalizeStudioEmail,
    queueMail,
    storeVerificationToken,
  })
}

export function hashStudioVerificationToken(token: string, secret: string) {
  if (secret.length < 32) {
    throw new Error('Studio authentication secret must contain 32+ characters')
  }

  return createHash('sha256').update(`${token}${secret}`).digest('hex')
}

function identifierHash(identifier: string, secret: string) {
  return createHmac('sha256', secret).update(identifier).digest('hex')
}

function defaultPause(milliseconds: number) {
  return new Promise<void>(resolve => setTimeout(resolve, milliseconds))
}

export function normalizeStudioEmail(identifier: string) {
  const normalized = identifier.normalize('NFKC').trim().toLowerCase()
  const parsed = emailSchema.safeParse(normalized)

  if (!parsed.success || /[\r\n,]/u.test(normalized)) {
    throw new Error('Invalid Studio email address')
  }

  return parsed.data
}
