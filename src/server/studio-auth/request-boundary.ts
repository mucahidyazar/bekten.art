import {normalizeStudioEmail} from './magic-link-coordinator'

type RateLimitResult = Readonly<{
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}>

type StudioMagicLinkRequestDependencies = Readonly<{
  appOrigin: string
  consumeRateLimit: (input: Readonly<{
    action: string
    identifier: string
    policy: Readonly<{limit: number; windowMs: number}>
  }>) => Promise<RateLimitResult>
  networkIdentifier: string
}>

const MAX_STUDIO_MAGIC_LINK_BODY_BYTES = 16 * 1024
const ALLOWED_CONTENT_TYPES = new Set([
  'application/x-www-form-urlencoded',
  'multipart/form-data',
])

function rejected(status: number, message: string, retryAfter?: number) {
  const headers = new Headers({'content-type': 'application/json'})

  if (retryAfter) headers.set('retry-after', String(retryAfter))

  return Object.freeze({
    allowed: false as const,
    response: Response.json(
      {error: message, success: false},
      {headers, status},
    ),
  })
}

function sameOrigin(request: Request, appOrigin: string) {
  const origin = request.headers.get('origin')

  if (!origin) return false

  try {
    return new URL(origin).origin === new URL(appOrigin).origin
  } catch {
    return false
  }
}

async function requestIdentity(request: Request) {
  try {
    const body = await request.clone().formData()
    const email = body.get('email')

    return typeof email === 'string'
      ? normalizeStudioEmail(email)
      : 'invalid-studio-email'
  } catch {
    return 'invalid-studio-email'
  }
}

function requestContentType(request: Request) {
  return request.headers.get('content-type')?.split(';', 1)[0]?.trim() ?? ''
}

async function validateRequestBody(request: Request) {
  const contentEncoding = request.headers
    .get('content-encoding')
    ?.trim()
    .toLowerCase()

  if (contentEncoding && contentEncoding !== 'identity') {
    return rejected(415, 'Request body encoding is not supported.')
  }

  if (!ALLOWED_CONTENT_TYPES.has(requestContentType(request))) {
    return rejected(415, 'Request body type is not supported.')
  }

  const contentLength = request.headers.get('content-length')?.trim()

  if (contentLength) {
    const declaredLength = Number(contentLength)

    if (
      !Number.isSafeInteger(declaredLength) ||
      declaredLength < 0 ||
      declaredLength > MAX_STUDIO_MAGIC_LINK_BODY_BYTES
    ) {
      return rejected(413, 'Request body is too large.')
    }
  }

  const reader = request.clone().body?.getReader()

  if (!reader) return null

  let receivedBytes = 0

  try {
    while (true) {
      const chunk = await reader.read()

      if (chunk.done) return null

      receivedBytes += chunk.value.byteLength

      if (receivedBytes > MAX_STUDIO_MAGIC_LINK_BODY_BYTES) {
        void reader.cancel()

        return rejected(413, 'Request body is too large.')
      }
    }
  } catch {
    return rejected(400, 'Request body is invalid.')
  }
}

async function guardStudioMagicLinkRequest(
  request: Request,
  dependencies: StudioMagicLinkRequestDependencies,
) {
  if (!sameOrigin(request, dependencies.appOrigin)) {
    return rejected(403, 'Request origin is not allowed.')
  }

  const bodyRejection = await validateRequestBody(request)

  if (bodyRejection) return bodyRejection

  const identity = await requestIdentity(request)
  const policy = {limit: 5, windowMs: 15 * 60_000}
  const networkLimit = await dependencies.consumeRateLimit({
    action: 'studio_magic_link_network',
    identifier: dependencies.networkIdentifier,
    policy,
  })

  if (!networkLimit.allowed) {
    return rejected(
      429,
      'Too many requests. Please try again later.',
      networkLimit.retryAfterSeconds,
    )
  }

  const identityLimit = await dependencies.consumeRateLimit({
    action: 'studio_magic_link_identity',
    identifier: identity,
    policy: {...policy, limit: 3},
  })

  if (!identityLimit.allowed) {
    return rejected(
      429,
      'Too many requests. Please try again later.',
      identityLimit.retryAfterSeconds,
    )
  }

  return Object.freeze({allowed: true as const})
}

export {MAX_STUDIO_MAGIC_LINK_BODY_BYTES, guardStudioMagicLinkRequest}
