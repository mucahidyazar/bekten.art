import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  authHandler: vi.fn().mockResolvedValue(new Response(null, {status: 204})),
  guard: vi.fn().mockResolvedValue({allowed: true}),
  nextAuth: vi.fn(),
}))

vi.mock('next-auth', () => ({
  default: mocks.nextAuth,
}))
vi.mock('@/auth', () => ({getAuthOptions: vi.fn(() => ({providers: []}))}))
vi.mock('@/server/studio-auth/configured-request-boundary', () => ({
  guardConfiguredStudioMagicLinkRequest: mocks.guard,
}))

describe('NextAuth Studio route', () => {
  const routeContext = {
    params: Promise.resolve({nextauth: ['signin', 'email']}),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.nextAuth.mockReturnValue(mocks.authHandler)
  })

  it('does not construct the secret-bound handler during route discovery', async () => {
    await import('./route')

    expect(mocks.nextAuth).not.toHaveBeenCalled()
  })

  it('guards the email sign-in request before delegating to NextAuth', async () => {
    const {POST} = await import('./route')
    const request = new Request(
      'https://bekten.art/api/auth/signin/email',
      {method: 'POST'},
    )

    await POST(request, routeContext)

    expect(mocks.guard).toHaveBeenCalledWith(request)
    expect(mocks.authHandler).toHaveBeenCalledWith(request, routeContext)
  })

  it('returns the boundary rejection without invoking NextAuth', async () => {
    const response = new Response(null, {status: 429})

    mocks.guard.mockResolvedValueOnce({allowed: false, response})
    const {POST} = await import('./route')

    const request = new Request(
      'https://bekten.art/api/auth/signin/email',
      {method: 'POST'},
    )

    await expect(POST(request, routeContext)).resolves.toBe(response)
    expect(mocks.authHandler).not.toHaveBeenCalled()
  })

  it('leaves callback and sign-out protocol requests to NextAuth', async () => {
    const {POST} = await import('./route')
    const request = new Request(
      'https://bekten.art/api/auth/signout',
      {method: 'POST'},
    )

    const signOutContext = {
      params: Promise.resolve({nextauth: ['signout']}),
    }

    await POST(request, signOutContext)

    expect(mocks.guard).not.toHaveBeenCalled()
    expect(mocks.authHandler).toHaveBeenCalledWith(request, signOutContext)
  })

  it('forwards the App Router context on GET protocol requests', async () => {
    const {GET} = await import('./route')
    const request = new Request('https://bekten.art/api/auth/providers')
    const context = {params: Promise.resolve({nextauth: ['providers']})}

    await GET(request, context)

    expect(mocks.authHandler).toHaveBeenCalledWith(request, context)
  })
})
