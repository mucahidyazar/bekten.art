import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({unsubscribe: vi.fn()}))

vi.mock('@/server/email/configured-newsletter-service', () => ({
  getConfiguredNewsletterService: () => ({unsubscribe: mocks.unsubscribe}),
}))

import {GET, POST} from './route'

const token = 'v1.initialization-vector.encrypted.authentication-tag'

function mutation(origin = 'https://bekten.art') {
  return new Request('https://bekten.art/api/newsletter/unsubscribe', {
    headers: {
      cookie: `bekten_newsletter_unsubscribe=${token}`,
      origin,
    },
    method: 'POST',
  })
}

describe('/api/newsletter/unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bekten.art')
    mocks.unsubscribe.mockResolvedValue({accepted: true})
  })

  it('GET validates without consuming and redirects to a token-free confirmation UI', async () => {
    const response = await GET(
      new Request(
        `https://bekten.art/api/newsletter/unsubscribe?token=${token}&locale=ru`,
      ),
    )

    expect(mocks.unsubscribe).not.toHaveBeenCalled()
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'https://bekten.art/ru/confirm-email-action?action=newsletter-unsubscribe',
    )
    expect(response.headers.get('set-cookie')).toContain(
      `bekten_newsletter_unsubscribe=${token}`,
    )
  })

  it('POST consumes the staged token and returns the same result on replay', async () => {
    const first = await POST(mutation())

    mocks.unsubscribe.mockResolvedValueOnce({accepted: true})
    const replay = await POST(mutation())

    expect(mocks.unsubscribe).toHaveBeenCalledTimes(2)
    expect(first.headers.get('location')).toBe(
      'https://bekten.art/en?newsletter=unsubscribed',
    )
    expect(replay.headers.get('location')).toBe(
      'https://bekten.art/en?newsletter=unsubscribed',
    )
  })

  it('POST rejects cross-origin mutations before consumption', async () => {
    const response = await POST(mutation('https://evil.test'))

    expect(response.status).toBe(403)
    expect(mocks.unsubscribe).not.toHaveBeenCalled()
  })

  it('supports the signed RFC 8058 one-click POST without a browser cookie', async () => {
    const response = await POST(
      new Request(
        `https://bekten.art/api/newsletter/unsubscribe?token=${token}`,
        {
          body: 'List-Unsubscribe=One-Click',
          headers: {'content-type': 'application/x-www-form-urlencoded'},
          method: 'POST',
        },
      ),
    )

    expect(response.status).toBe(200)
    expect(mocks.unsubscribe).toHaveBeenCalledWith(token)
  })
})
