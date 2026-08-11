import {describe, expect, it, vi} from 'vitest'

const prisma = vi.hoisted(() => ({
  auditEvent: {
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}))
const getServerSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({prisma}))
vi.mock('next-auth', async () => ({
  ...(await vi.importActual<typeof import('next-auth')>('next-auth')),
  getServerSession,
}))
vi.stubEnv('AUTH_SECRET', 'a'.repeat(64))

describe('auth options', () => {
  it('exposes only the private Studio email provider', async () => {
    const authOptions = (await import('./auth')).getAuthOptions()

    expect(authOptions.providers).toHaveLength(1)
    expect(authOptions.providers[0]).toMatchObject({
      id: 'email',
      maxAge: 10 * 60,
      type: 'email',
    })
  })

  it('points the retained session protocol at the private Studio sign-in', async () => {
    const authOptions = (await import('./auth')).getAuthOptions()

    expect(authOptions.pages).toEqual({
      error: '/dashboard/sign-in',
      signIn: '/dashboard/sign-in',
    })
  })

  it('uses short database sessions and hardened cookies', async () => {
    const authOptions = (await import('./auth')).getAuthOptions()

    expect(authOptions.session).toMatchObject({
      maxAge: 8 * 60 * 60,
      strategy: 'database',
      updateAge: 30 * 60,
    })
    expect(authOptions.cookies?.sessionToken?.options).toMatchObject({
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    })
  })

  it('keeps the verification request generic and role-gates token consumption', async () => {
    const authOptions = (await import('./auth')).getAuthOptions()
    const signIn = authOptions.callbacks?.signIn

    await expect(
      signIn?.({
        account: null,
        email: {verificationRequest: true},
        profile: undefined,
        user: {email: 'unknown@example.com', id: 'unknown'},
      }),
    ).resolves.toBe(true)
    await expect(
      signIn?.({
        account: null,
        credentials: undefined,
        email: undefined,
        profile: undefined,
        user: {email: 'user@example.com', id: 'user', role: 'USER'},
      }),
    ).resolves.toBe(false)
    await expect(
      signIn?.({
        account: null,
        credentials: undefined,
        email: undefined,
        profile: undefined,
        user: {
          email: 'editor@example.com',
          id: 'editor',
          role: 'EDITOR' as never,
        },
      }),
    ).resolves.toBe(true)
  })

  it('maps the current adapter user into the database session', async () => {
    const authOptions = (await import('./auth')).getAuthOptions()

    await expect(
      authOptions.callbacks?.session?.({
        newSession: {},
        session: {
          expires: '2026-08-11T12:00:00.000Z',
          user: {email: 'owner@example.com', id: ''},
        },
        token: {},
        trigger: 'update',
        user: {
          email: 'owner@example.com',
          emailVerified: new Date('2026-08-10T12:00:00.000Z'),
          id: 'owner-1',
          role: 'OWNER' as never,
        },
      }),
    ).resolves.toMatchObject({
      user: {id: 'owner-1', role: 'OWNER'},
    })
  })

  it('keeps redirects on the canonical Studio origin', async () => {
    const authOptions = (await import('./auth')).getAuthOptions()

    await expect(
      authOptions.callbacks?.redirect?.({
        baseUrl: 'https://bekten.art',
        url: 'https://attacker.example/steal',
      }),
    ).resolves.toBe('https://bekten.art/dashboard')
  })

  it('normalizes exactly one Studio email address', async () => {
    const authOptions = (await import('./auth')).getAuthOptions()
    const provider = authOptions.providers[0]

    expect(
      typeof provider === 'function' || provider.type !== 'email'
        ? undefined
        : provider.normalizeIdentifier?.(' Owner@Example.COM '),
    ).toBe('owner@example.com')
  })

  it('audits successful sign-in and sign-out lifecycle events', async () => {
    const authOptions = (await import('./auth')).getAuthOptions()

    await authOptions.events?.signIn?.({
      account: null,
      isNewUser: false,
      user: {email: 'owner@example.com', id: 'owner-1'},
    })
    await authOptions.events?.signOut?.({
      session: {
        expires: '2026-08-11T12:00:00.000Z',
        sessionToken: 'session-token',
        userId: 'owner-1',
      } as never,
      token: {},
    })

    expect(prisma.auditEvent.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        action: 'studio.sign-in.completed',
        actorUserId: 'owner-1',
      }),
    })
    expect(prisma.auditEvent.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        action: 'studio.sign-out.completed',
        actorUserId: 'owner-1',
      }),
    })
  })

  it('provides the configured options to server-side session reads', async () => {
    const {auth, getAuthOptions} = await import('./auth')
    const authOptions = getAuthOptions()

    getServerSession.mockResolvedValueOnce(null)

    await expect(auth()).resolves.toBeNull()
    expect(getServerSession).toHaveBeenCalledWith(authOptions)
  })
})
