import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const prisma = vi.hoisted(() => ({
  account: {updateMany: vi.fn().mockResolvedValue({count: 1})},
  user: {
    findUnique: vi.fn(),
    updateMany: vi.fn().mockResolvedValue({count: 1}),
  },
}))

vi.mock('@/lib/db', () => ({prisma}))

describe('auth options', () => {
  beforeEach(() => {
    vi.resetModules()
    prisma.account.updateMany.mockClear()
    process.env.AUTH_GOOGLE_ID = 'google-client-id'
    process.env.AUTH_GOOGLE_SECRET = 'google-client-secret'
  })

  afterEach(() => {
    delete process.env.AUTH_GOOGLE_ID
    delete process.env.AUTH_GOOGLE_SECRET
  })

  it('uses least-privilege Google sign-in without offline access', async () => {
    const {authOptions} = await import('./auth')
    const google = authOptions.providers.find(provider => provider.id === 'google')
    const authorization = google?.options?.authorization as
      | {params?: Record<string, string>}
      | undefined

    expect(authorization?.params).toMatchObject({
      prompt: 'select_account',
      response_type: 'code',
      scope: 'openid email profile',
    })
    expect(authorization?.params).not.toHaveProperty('access_type')
  })

  it('removes provider bearer tokens after a Google account is linked', async () => {
    const {authOptions} = await import('./auth')

    await authOptions.events?.signIn?.({
      account: {
        provider: 'google',
        providerAccountId: 'google-subject',
        type: 'oauth',
      },
      isNewUser: false,
      profile: undefined,
      user: {id: 'user-id'},
    })

    expect(prisma.account.updateMany).toHaveBeenCalledWith({
      data: {
        access_token: null,
        expires_at: null,
        id_token: null,
        refresh_token: null,
        session_state: null,
        token_type: null,
      },
      where: {
        provider: 'google',
        providerAccountId: 'google-subject',
      },
    })
  })
})
