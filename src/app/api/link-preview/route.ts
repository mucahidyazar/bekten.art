import {type CheerioAPI, load} from 'cheerio'

import {consumeConfiguredRateLimit} from '@/server/auth/configured-rate-limit'
import {isSameOriginMutation} from '@/server/auth/mutation-origin'
import {
  getClientAddress,
  shouldTrustProxy,
} from '@/server/auth/request-context'
import {
  InvalidRequestBodyError,
  readBoundedText,
  RequestBodyTooLargeError,
} from '@/server/http/bounded-body'

import {
  fetchSafeHtml,
  LinkPreviewSecurityError,
  validatePreviewUrl,
} from '../../../server/security/safe-link-preview'

const MAX_REQUEST_BYTES = 4 * 1024
const MAX_DESCRIPTION_LENGTH = 500
const MAX_TITLE_LENGTH = 200
const IP_RATE_LIMIT_POLICY = Object.freeze({limit: 12, windowMs: 60_000})
const HOST_RATE_LIMIT_POLICY = Object.freeze({limit: 60, windowMs: 60_000})

export async function POST(request: Request) {
  try {
    if (!isSameOriginMutation(request, getAppOrigin())) {
      return json({message: 'Request is not allowed.'}, 403)
    }

    const rawBody = await readBoundedText(request, MAX_REQUEST_BYTES)
    const payload = JSON.parse(rawBody) as unknown
    const link = readLink(payload)

    // Validate before DNS/network work so malformed input fails quickly.
    const target = validatePreviewUrl(link)
    const networkLimit = await consumeConfiguredRateLimit({
      action: 'link_preview_ip',
      identifier: getClientAddress(request, shouldTrustProxy()),
      policy: IP_RATE_LIMIT_POLICY,
    })

    if (!networkLimit.allowed) {
      return tooManyRequests(networkLimit.retryAfterSeconds)
    }

    const hostLimit = await consumeConfiguredRateLimit({
      action: 'link_preview_host',
      identifier: normalizeTargetHost(target),
      policy: HOST_RATE_LIMIT_POLICY,
    })

    if (!hostLimit.allowed) {
      return tooManyRequests(hostLimit.retryAfterSeconds)
    }

    const result = await fetchSafeHtml(target)
    const document = load(result.html)

    return json(
      {
        data: {
          description: normalizeText(
            document('meta[name="description"]').attr('content'),
            MAX_DESCRIPTION_LENGTH,
          ),
          image: readPreviewImage(document, result.finalUrl),
          title: normalizeText(getTitle(document), MAX_TITLE_LENGTH),
          url: result.finalUrl.href,
        },
      },
      200,
    )
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return json({message: 'The request body is too large.'}, 413)
    }

    if (
      error instanceof InvalidRequestBodyError ||
      error instanceof SyntaxError ||
      (error instanceof LinkPreviewSecurityError && error.kind === 'invalid-url')
    ) {
      return json({message: 'A valid link is required.'}, 400)
    }

    if (error instanceof LinkPreviewSecurityError) {
      return json(
        {message: 'Unable to retrieve a preview for this link.'},
        error.kind === 'timeout' ? 504 : 422,
      )
    }

    console.error('Unexpected link preview failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return json({message: 'Unable to retrieve a preview for this link.'}, 500)
  }
}

function getAppOrigin() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim()

  if (!configured) {
    throw new Error('Link preview application origin is not configured')
  }

  return new URL(configured).origin
}

function json(payload: unknown, status: number, headers?: HeadersInit) {
  return Response.json(payload, {
    headers: {'Cache-Control': 'private, no-store', ...headers},
    status,
  })
}

function tooManyRequests(retryAfterSeconds: number) {
  return json(
    {message: 'Too many requests. Please try again later.'},
    429,
    {'Retry-After': String(retryAfterSeconds)},
  )
}

function normalizeTargetHost(target: URL) {
  return target.hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
}

function readLink(payload: unknown): string {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('link' in payload) ||
    typeof payload.link !== 'string' ||
    payload.link.trim().length === 0
  ) {
    throw new LinkPreviewSecurityError(
      'The preview URL is invalid.',
      'invalid-url',
    )
  }

  return payload.link.trim()
}

function readPreviewImage(document: CheerioAPI, baseUrl: URL) {
  const candidate =
    document('meta[property="og:image"]').attr('content') ||
    document('meta[name="twitter:image"]').attr('content') ||
    document('meta[itemprop="image"]').attr('content')

  if (!candidate) return undefined

  try {
    return validatePreviewUrl(new URL(candidate, baseUrl)).href
  } catch {
    return undefined
  }
}

function metaTagContent(document: CheerioAPI, type: string, attribute: string) {
  return document(`meta[${attribute}='${type}']`).attr('content')
}

function getTitle(document: CheerioAPI) {
  return (
    metaTagContent(document, 'og:title', 'property') ||
    metaTagContent(document, 'og:title', 'name') ||
    document('title').text()
  )
}

function normalizeText(value: string | undefined, maxLength: number) {
  if (!value) return undefined

  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength) || undefined
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
