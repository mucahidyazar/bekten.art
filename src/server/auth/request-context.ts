import {isIP} from 'node:net'

type AuthRequest = Readonly<{
  headers?:
    | Headers
    | Readonly<Record<string, string | readonly string[] | undefined>>
}>

function readHeader(request: AuthRequest, name: string) {
  const headers = request.headers

  if (!headers) {
    return undefined
  }

  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined
  }

  const value = headers[name]

  return Array.isArray(value) ? value[0] : value
}

export function getClientAddress(request: AuthRequest, trustProxy: boolean) {
  if (!trustProxy) {
    return 'unavailable'
  }

  const forwardedAddress = readHeader(request, 'x-forwarded-for')
    ?.split(',')[0]
    ?.trim()
  const realAddress = readHeader(request, 'x-real-ip')?.trim()
  const candidate = forwardedAddress || realAddress

  return candidate && isIP(candidate) ? candidate : 'unavailable'
}

export function getRequiredAuthSecret(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  const secret = environment.NEXTAUTH_SECRET ?? environment.AUTH_SECRET

  if (!secret || secret.length < 32) {
    throw new Error('A 32+ character authentication secret is required')
  }

  return secret
}

export function shouldTrustProxy(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  return environment.AUTH_TRUST_PROXY === 'true'
}
