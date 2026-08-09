import {beforeEach, describe, expect, it, vi} from 'vitest'

const {consumeRateLimitMock, fetchSafeHtmlMock} = vi.hoisted(() => ({
  consumeRateLimitMock: vi.fn(),
  fetchSafeHtmlMock: vi.fn(),
}))

vi.mock('@/server/auth/configured-rate-limit', () => ({
  consumeConfiguredRateLimit: consumeRateLimitMock,
}))

vi.mock('../../../server/security/safe-link-preview', async importOriginal => {
  const actual = await importOriginal<
    typeof import('../../../server/security/safe-link-preview')
  >()

  return {...actual, fetchSafeHtml: fetchSafeHtmlMock}
})

import {LinkPreviewSecurityError} from '../../../server/security/safe-link-preview'

import {POST} from './route'

function post(body: unknown, headers?: HeadersInit) {
  return new Request('https://bekten.art/api/link-preview', {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      origin: 'https://bekten.art',
      'x-forwarded-for': '203.0.113.8',
      ...headers,
    },
    method: 'POST',
  })
}

describe('POST /api/link-preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AUTH_TRUST_PROXY', 'true')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bekten.art')
    consumeRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 9,
      retryAfterSeconds: 0,
    })
  })

  it.each([undefined, 'https://attacker.example'])(
    'rejects a missing or foreign origin before parsing or rate-limit work',
    async origin => {
      const request = post({link: 'https://example.com'})

      if (origin) request.headers.set('origin', origin)
      else request.headers.delete('origin')

      const response = await POST(request)

      expect(response.status).toBe(403)
      expect(response.headers.get('cache-control')).toBe('private, no-store')
      await expect(response.json()).resolves.toEqual({
        message: 'Request is not allowed.',
      })
      expect(consumeRateLimitMock).not.toHaveBeenCalled()
      expect(fetchSafeHtmlMock).not.toHaveBeenCalled()
    },
  )

  it('short-circuits on the network-address limit before the target-host bucket', async () => {
    consumeRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 73,
    })

    const response = await POST(post({link: 'https://example.com/article'}))

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('73')
    await expect(response.json()).resolves.toEqual({
      message: 'Too many requests. Please try again later.',
    })
    expect(consumeRateLimitMock).toHaveBeenCalledTimes(1)
    expect(consumeRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'link_preview_ip',
        identifier: '203.0.113.8',
      }),
    )
    expect(fetchSafeHtmlMock).not.toHaveBeenCalled()
  })

  it('normalizes and limits the target host only after the IP bucket allows it', async () => {
    consumeRateLimitMock
      .mockResolvedValueOnce({
        allowed: true,
        remaining: 8,
        retryAfterSeconds: 0,
      })
      .mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 41,
      })

    const response = await POST(
      post({link: 'https://EXAMPLE.com./article?utm_source=test'}),
    )

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('41')
    expect(consumeRateLimitMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        action: 'link_preview_host',
        identifier: 'example.com',
      }),
    )
    expect(fetchSafeHtmlMock).not.toHaveBeenCalled()
  })

  it('validates the request body before attempting an outbound request', async () => {
    const response = await POST(post({link: 'not a URL'}))

    expect(response.status).toBe(400)
    expect(fetchSafeHtmlMock).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({
      message: 'A valid link is required.',
    })
  })

  it('rejects oversized bodies', async () => {
    const response = await POST(
      post({link: `https://example.com/${'a'.repeat(5_000)}`}),
    )

    expect(response.status).toBe(413)
    expect(fetchSafeHtmlMock).not.toHaveBeenCalled()
  })

  it('returns sanitized metadata from the guarded fetcher', async () => {
    fetchSafeHtmlMock.mockResolvedValue({
      contentType: 'text/html; charset=utf-8',
      finalUrl: new URL('https://example.com/articles/final'),
      html: `
        <html>
          <head>
            <title>  Safe   title  </title>
            <meta name="description" content=" A useful   description ">
            <meta property="og:image" content="/cover.jpg">
          </head>
        </html>
      `,
    })

    const response = await POST(post({link: 'https://example.com/start'}))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: {
        description: 'A useful description',
        image: 'https://example.com/cover.jpg',
        title: 'Safe title',
        url: 'https://example.com/articles/final',
      },
    })
  })

  it('omits an image when the remote page has no safe image metadata', async () => {
    fetchSafeHtmlMock.mockResolvedValue({
      contentType: 'text/html; charset=utf-8',
      finalUrl: new URL('https://example.com/articles/text-only'),
      html: '<html><head><title>Text only</title></head></html>',
    })

    const response = await POST(post({link: 'https://example.com/text-only'}))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: {
        title: 'Text only',
        url: 'https://example.com/articles/text-only',
      },
    })
  })

  it('does not leak internal provider errors', async () => {
    fetchSafeHtmlMock.mockRejectedValue(
      new LinkPreviewSecurityError(
        'The preview host did not resolve exclusively to public addresses.',
        'network',
      ),
    )

    const response = await POST(post({link: 'https://example.com'}))

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({
      message: 'Unable to retrieve a preview for this link.',
    })
  })
})
