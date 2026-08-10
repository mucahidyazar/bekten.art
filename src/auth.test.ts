import {describe, expect, it, vi} from 'vitest'

const prisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}))

vi.mock('@/lib/db', () => ({prisma}))

describe('auth options', () => {
  it('exposes only the private Studio email provider', async () => {
    const {authOptions} = await import('./auth')

    expect(authOptions.providers).toHaveLength(1)
    expect(authOptions.providers[0]).toMatchObject({
      id: 'email',
      maxAge: 10 * 60,
      type: 'email',
    })
  })

  it('points the retained session protocol at the private Studio sign-in', async () => {
    const {authOptions} = await import('./auth')

    expect(authOptions.pages).toEqual({
      error: '/studio/sign-in',
      signIn: '/studio/sign-in',
    })
  })

  it('uses short database sessions and hardened cookies', async () => {
    const {authOptions} = await import('./auth')

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
    const {authOptions} = await import('./auth')
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
        user: {email: 'editor@example.com', id: 'editor', role: 'EDITOR'},
      }),
    ).resolves.toBe(true)
  })
})
