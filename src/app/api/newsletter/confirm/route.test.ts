import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({confirm: vi.fn()}))

vi.mock('@/server/email/configured-newsletter-service', () => ({
  getConfiguredNewsletterService: () => ({confirm: mocks.confirm}),
}))

import {GET, POST} from './route'

const token = 'v1.initialization-vector.encrypted.authentication-tag'

function mutation(origin = 'https://bekten.art') {
  return new Request('https://bekten.art/api/newsletter/confirm', {
    headers: {
      cookie: `bekten_newsletter_confirmation=${token}`,
      origin,
    },
    method: 'POST',
  })
}

describe('/api/newsletter/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bekten.art')
    mocks.confirm.mockResolvedValue({accepted: true})
  })

  it('GET validates without consuming and redirects to a token-free confirmation UI', async () => {
    const response = await GET(
      new Request(
        `https://bekten.art/api/newsletter/confirm?token=${token}&locale=tr`,
      ),
    )

    expect(mocks.confirm).not.toHaveBeenCalled()
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'https://bekten.art/tr/confirm-email-action?action=newsletter-confirm',
    )
    expect(response.headers.get('set-cookie')).toContain(
      `bekten_newsletter_confirmation=${token}`,
    )
    expect(response.headers.get('set-cookie')).toContain('HttpOnly')
  })

  it('GET rejects a missing token without mutation', async () => {
    const response = await GET(
      new Request('https://bekten.art/api/newsletter/confirm'),
    )

    expect(mocks.confirm).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toBe(
      'https://bekten.art/en?newsletter=unavailable',
    )
  })

  it('POST consumes the staged token and clears it', async () => {
    const response = await POST(mutation())

    expect(mocks.confirm).toHaveBeenCalledWith(token)
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'https://bekten.art/en?newsletter=confirmed',
    )
    expect(response.headers.get('set-cookie')).toContain(
      'bekten_newsletter_confirmation=;',
    )
  })

  it('POST rejects cross-origin mutations before consumption', async () => {
    const response = await POST(mutation('https://evil.test'))

    expect(response.status).toBe(403)
    expect(mocks.confirm).not.toHaveBeenCalled()
  })
})
