import {describe, expect, it, vi} from 'vitest'

const prisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}))

vi.mock('@/lib/db', () => ({prisma}))

describe('auth options', () => {
  it('exposes no public credentials or Google provider during V2 cleanup', async () => {
    const {authOptions} = await import('./auth')

    expect(authOptions.providers).toEqual([])
  })

  it('points the retained session protocol at the private Studio sign-in', async () => {
    const {authOptions} = await import('./auth')

    expect(authOptions.pages).toEqual({
      error: '/studio/sign-in',
      signIn: '/studio/sign-in',
    })
  })
})
