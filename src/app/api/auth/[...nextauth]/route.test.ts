import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  authHandler: vi.fn().mockResolvedValue(new Response(null, {status: 204})),
  guard: vi.fn().mockResolvedValue({allowed: true}),
}))

vi.mock('next-auth', () => ({
  default: vi.fn(() => mocks.authHandler),
}))
vi.mock('@/auth', () => ({authOptions: {providers: []}}))
vi.mock('@/server/studio-auth/configured-request-boundary', () => ({
  guardConfiguredStudioMagicLinkRequest: mocks.guard,
}))

describe('NextAuth Studio route', () => {
  beforeEach(() => vi.clearAllMocks())

  it('guards the email sign-in request before delegating to NextAuth', async () => {
    const {POST} = await import('./route')
    const request = new Request(
      'https://bekten.art/api/auth/signin/email',
      {method: 'POST'},
    )

    await POST(request)

    expect(mocks.guard).toHaveBeenCalledWith(request)
    expect(mocks.authHandler).toHaveBeenCalledWith(request)
  })

  it('returns the boundary rejection without invoking NextAuth', async () => {
    const response = new Response(null, {status: 429})

    mocks.guard.mockResolvedValueOnce({allowed: false, response})
    const {POST} = await import('./route')

    const request = new Request(
      'https://bekten.art/api/auth/signin/email',
      {method: 'POST'},
    )

    await expect(POST(request)).resolves.toBe(response)
    expect(mocks.authHandler).not.toHaveBeenCalled()
  })

  it('leaves callback and sign-out protocol requests to NextAuth', async () => {
    const {POST} = await import('./route')
    const request = new Request(
      'https://bekten.art/api/auth/signout',
      {method: 'POST'},
    )

    await POST(request)

    expect(mocks.guard).not.toHaveBeenCalled()
    expect(mocks.authHandler).toHaveBeenCalledWith(request)
  })
})
