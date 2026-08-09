import {lookup} from 'node:dns/promises'
import http from 'node:http'
import https from 'node:https'
import {isIP} from 'node:net'

const DEFAULT_MAX_BYTES = 512 * 1024
const DEFAULT_MAX_REDIRECTS = 3
const DEFAULT_TIMEOUT_MS = 3_000
const MAX_URL_LENGTH = 2_048
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

export class LinkPreviewSecurityError extends Error {
  constructor(
    message: string,
    readonly kind: 'invalid-url' | 'network' | 'response' | 'timeout',
  ) {
    super(message)
    this.name = 'LinkPreviewSecurityError'
  }
}

export type PreviewHttpResponse = {
  body: Uint8Array
  headers: Record<string, string | undefined>
  status: number
}

type RequestOptions = {
  maxBytes: number
  signal: AbortSignal
}

type SafeFetchOptions = {
  maxBytes?: number
  maxRedirects?: number
  requestUrl?: (
    target: URL,
    address: ResolvedAddress,
    options: RequestOptions,
  ) => Promise<PreviewHttpResponse>
  resolveHost?: (hostname: string) => Promise<ResolvedAddress[]>
  timeoutMs?: number
}

export type ResolvedAddress = {
  address: string
  family: 4 | 6
}

export type SafeHtmlResult = {
  contentType: string
  finalUrl: URL
  html: string
}

export async function fetchSafeHtml(
  input: string | URL,
  options: SafeFetchOptions = {},
): Promise<SafeHtmlResult> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const resolveHost = options.resolveHost ?? defaultResolveHost
  const requestUrl = options.requestUrl ?? requestPinnedUrl

  if (maxBytes < 1 || maxRedirects < 0 || timeoutMs < 1) {
    throw new LinkPreviewSecurityError('Invalid preview limits.', 'invalid-url')
  }

  const controller = new AbortController()
  const timeoutError = new LinkPreviewSecurityError(
    'The link preview request timed out.',
    'timeout',
  )
  const timeoutId = setTimeout(() => controller.abort(timeoutError), timeoutMs)

  try {
    let target = validatePreviewUrl(input)

    for (let redirectCount = 0; ; redirectCount += 1) {
      const hostname = normalizeHostname(target.hostname)
      const addresses = await waitForAbort(
        resolveHost(hostname),
        controller.signal,
      )

      if (addresses.length === 0 || addresses.some(item => !isPublicIpAddress(item.address))) {
        throw new LinkPreviewSecurityError(
          'The preview host did not resolve exclusively to public addresses.',
          'network',
        )
      }

      const response = await waitForAbort(
        requestUrl(target, addresses[0], {
          maxBytes,
          signal: controller.signal,
        }),
        controller.signal,
      )

      if (REDIRECT_STATUSES.has(response.status)) {
        if (redirectCount >= maxRedirects) {
          throw new LinkPreviewSecurityError(
            'The link preview exceeded the redirect limit.',
            'response',
          )
        }

        const location = response.headers.location

        if (!location) {
          throw new LinkPreviewSecurityError(
            'The link preview returned an invalid redirect.',
            'response',
          )
        }

        const redirectedTarget = validatePreviewUrl(new URL(location, target))

        if (target.protocol === 'https:' && redirectedTarget.protocol === 'http:') {
          throw new LinkPreviewSecurityError(
            'HTTPS preview requests cannot redirect to HTTP.',
            'response',
          )
        }

        target = redirectedTarget
        continue
      }

      if (response.status < 200 || response.status >= 300) {
        throw new LinkPreviewSecurityError(
          'The link preview returned an unsuccessful response.',
          'response',
        )
      }

      const contentType = response.headers['content-type']?.toLowerCase() ?? ''

      if (
        !contentType.startsWith('text/html') &&
        !contentType.startsWith('application/xhtml+xml')
      ) {
        throw new LinkPreviewSecurityError(
          'The link preview returned an unsupported content type.',
          'response',
        )
      }

      if (response.body.byteLength > maxBytes) {
        throw new LinkPreviewSecurityError(
          'The link preview response is too large.',
          'response',
        )
      }

      return {
        contentType,
        finalUrl: target,
        html: new TextDecoder().decode(response.body),
      }
    }
  } catch (error) {
    if (controller.signal.aborted) throw timeoutError
    if (error instanceof LinkPreviewSecurityError) throw error
    throw new LinkPreviewSecurityError(
      'The link preview request failed.',
      'network',
    )
  } finally {
    clearTimeout(timeoutId)
  }
}

/** Returns true only for globally routable IPv4/IPv6 addresses. */
export function isPublicIpAddress(address: string): boolean {
  const normalized = address.split('%', 1)[0]
  const family = isIP(normalized)

  if (family === 4) {
    const numeric = ipv4ToNumber(normalized)

    return !NON_PUBLIC_IPV4_RANGES.some(([base, bits]) =>
      isIpv4InCidr(numeric, base, bits),
    )
  }

  if (family === 6) {
    const bytes = ipv6ToBytes(normalized)

    if (!bytes) return false

    // IPv4-mapped IPv6 addresses need the IPv4 policy too.
    if (
      bytes.slice(0, 10).every(byte => byte === 0) &&
      bytes[10] === 0xff &&
      bytes[11] === 0xff
    ) {
      return isPublicIpAddress(
        `${bytes[12]}.${bytes[13]}.${bytes[14]}.${bytes[15]}`,
      )
    }

    // Globally routable unicast IPv6 currently lives in 2000::/3. This also
    // rejects loopback, unspecified, ULA, link-local, multicast and NAT64
    // encodings that could otherwise hide a private IPv4 destination.
    if ((bytes[0] & 0xe0) !== 0x20) return false

    // 2001:db8::/32 is reserved for documentation, not a public destination.
    if (
      bytes[0] === 0x20 &&
      bytes[1] === 0x01 &&
      bytes[2] === 0x0d &&
      bytes[3] === 0xb8
    ) {
      return false
    }

    return true
  }

  return false
}

/**
 * Applies the URL-level portion of the SSRF policy. DNS results still have to
 * be checked immediately before the request and the request must be pinned to
 * one of those checked addresses.
 */
export function validatePreviewUrl(input: string | URL): URL {
  const raw = typeof input === 'string' ? input : input.href

  if (raw.length === 0 || raw.length > MAX_URL_LENGTH) {
    throw new LinkPreviewSecurityError('The preview URL is invalid.', 'invalid-url')
  }

  let target: URL

  try {
    target = new URL(raw)
  } catch {
    throw new LinkPreviewSecurityError('The preview URL is invalid.', 'invalid-url')
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    throw new LinkPreviewSecurityError(
      'Only HTTP and HTTPS preview URLs are allowed.',
      'invalid-url',
    )
  }

  if (target.username || target.password) {
    throw new LinkPreviewSecurityError(
      'Preview URLs cannot contain credentials.',
      'invalid-url',
    )
  }

  if (
    (target.protocol === 'http:' && target.port && target.port !== '80') ||
    (target.protocol === 'https:' && target.port && target.port !== '443')
  ) {
    throw new LinkPreviewSecurityError(
      'Preview URLs must use a standard web port.',
      'invalid-url',
    )
  }

  const hostname = normalizeHostname(target.hostname)

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === 'metadata' ||
    hostname === 'metadata.google.internal' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.home') ||
    hostname.endsWith('.lan')
  ) {
    throw new LinkPreviewSecurityError(
      'Local preview hosts are not allowed.',
      'invalid-url',
    )
  }

  if (isIP(hostname) !== 0 && !isPublicIpAddress(hostname)) {
    throw new LinkPreviewSecurityError(
      'Non-public preview addresses are not allowed.',
      'invalid-url',
    )
  }

  return target
}

async function defaultResolveHost(hostname: string): Promise<ResolvedAddress[]> {
  const results = await lookup(hostname, {all: true, verbatim: true})

  return results
    .filter(
      (result): result is {address: string; family: 4 | 6} =>
        result.family === 4 || result.family === 6,
    )
    .map(result => ({address: result.address, family: result.family}))
}

async function requestPinnedUrl(
  target: URL,
  address: ResolvedAddress,
  {maxBytes, signal}: RequestOptions,
): Promise<PreviewHttpResponse> {
  const client = target.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const request = client.request(
      target,
      {
        agent: false,
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Encoding': 'identity',
          'User-Agent': 'BektenArt-LinkPreview/1.0',
        },
        lookup: (_hostname, _lookupOptions, callback) => {
          callback(null, address.address, address.family)
        },
        method: 'GET',
        signal,
      },
      response => {
        const declaredLength = Number(response.headers['content-length'])

        if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
          response.destroy(
            new LinkPreviewSecurityError(
              'The link preview response is too large.',
              'response',
            ),
          )

          return
        }

        const chunks: Buffer[] = []
        let receivedBytes = 0

        response.on('data', (chunk: Buffer | string) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)

          receivedBytes += buffer.byteLength

          if (receivedBytes > maxBytes) {
            response.destroy(
              new LinkPreviewSecurityError(
                'The link preview response is too large.',
                'response',
              ),
            )

            return
          }

          chunks.push(buffer)
        })

        response.on('error', reject)
        response.on('end', () => {
          const headers = Object.fromEntries(
            Object.entries(response.headers).map(([key, value]) => [
              key.toLowerCase(),
              Array.isArray(value) ? value.join(', ') : value,
            ]),
          )

          resolve({
            body: Buffer.concat(chunks),
            headers,
            status: response.statusCode ?? 0,
          })
        })
      },
    )

    request.on('error', reject)
    request.end()
  })
}

function waitForAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason)

  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason)

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

function normalizeHostname(hostname: string): string {
  return hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
}

function ipv4ToNumber(address: string): number {
  return address
    .split('.')
    .map(Number)
    .reduce((result, octet) => ((result << 8) | octet) >>> 0, 0)
}

function isIpv4InCidr(address: number, base: number, bits: number): boolean {
  if (bits === 0) return true
  const mask = (0xffffffff << (32 - bits)) >>> 0

  return (address & mask) >>> 0 === (base & mask) >>> 0
}

function cidr(address: string, bits: number): readonly [number, number] {
  return [ipv4ToNumber(address), bits]
}

const NON_PUBLIC_IPV4_RANGES: ReadonlyArray<readonly [number, number]> = [
  cidr('0.0.0.0', 8),
  cidr('10.0.0.0', 8),
  cidr('100.64.0.0', 10),
  cidr('127.0.0.0', 8),
  cidr('169.254.0.0', 16),
  cidr('172.16.0.0', 12),
  cidr('192.0.0.0', 24),
  cidr('192.0.2.0', 24),
  cidr('192.88.99.0', 24),
  cidr('192.168.0.0', 16),
  cidr('198.18.0.0', 15),
  cidr('198.51.100.0', 24),
  cidr('203.0.113.0', 24),
  cidr('224.0.0.0', 4),
  cidr('240.0.0.0', 4),
]

function ipv6ToBytes(address: string): number[] | null {
  let source = address.toLowerCase()

  if (source.includes('.')) {
    const lastColon = source.lastIndexOf(':')
    const ipv4 = source.slice(lastColon + 1)

    if (isIP(ipv4) !== 4) return null
    const octets = ipv4.split('.').map(Number)

    source = `${source.slice(0, lastColon)}:${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`
  }

  const halves = source.split('::')

  if (halves.length > 2) return null

  const left = halves[0] ? halves[0].split(':') : []
  const right = halves[1] ? halves[1].split(':') : []
  const missing = 8 - left.length - right.length

  if ((halves.length === 1 && missing !== 0) || missing < 0) return null

  const groups = [
    ...left,
    ...Array.from({length: missing}, () => '0'),
    ...right,
  ]

  if (groups.length !== 8) return null

  const bytes: number[] = []

  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null
    const value = Number.parseInt(group, 16)

    bytes.push(value >> 8, value & 0xff)
  }

  return bytes
}
