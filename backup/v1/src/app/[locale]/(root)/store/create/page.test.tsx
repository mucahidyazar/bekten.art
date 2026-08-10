import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  AdminAccessRequiredError,
  AuthenticationRequiredError,
} from '@/server/auth/access'

import CreateStorePage from './page'

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
  requireAdminUser: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}))
vi.mock('@/server/auth/access', () => ({
  AdminAccessRequiredError: class AdminAccessRequiredError extends Error {},
  AuthenticationRequiredError: class AuthenticationRequiredError extends Error {},
  requireAdminUser: mocks.requireAdminUser,
}))

describe('CreateStorePage', () => {
  beforeEach(() => {
    mocks.redirect.mockReset()
    mocks.notFound.mockReset()
    mocks.requireAdminUser.mockReset()
  })

  it('requires an administrator before forwarding to content management', async () => {
    mocks.requireAdminUser.mockResolvedValue({id: 'admin', role: 'ADMIN'})

    await CreateStorePage({params: Promise.resolve({locale: 'tr'})})

    expect(mocks.requireAdminUser).toHaveBeenCalledOnce()
    expect(mocks.redirect).toHaveBeenCalledWith('/tr/admin/content')
  })

  it('does not redirect when the authorization guard rejects access', async () => {
    mocks.requireAdminUser.mockRejectedValue(new Error('Admin access required'))

    await expect(
      CreateStorePage({params: Promise.resolve({locale: 'en'})}),
    ).rejects.toThrow('Admin access required')
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it('redirects unauthenticated visitors to the localized sign-in page', async () => {
    mocks.requireAdminUser.mockRejectedValue(new AuthenticationRequiredError())

    await expect(
      CreateStorePage({params: Promise.resolve({locale: 'ky'})}),
    ).rejects.toBeInstanceOf(AuthenticationRequiredError)

    expect(mocks.redirect).toHaveBeenCalledWith('/ky/sign-in')
  })

  it('returns not found for an authenticated non-administrator', async () => {
    mocks.requireAdminUser.mockRejectedValue(new AdminAccessRequiredError())

    await expect(
      CreateStorePage({params: Promise.resolve({locale: 'en'})}),
    ).rejects.toBeInstanceOf(AdminAccessRequiredError)
    expect(mocks.notFound).toHaveBeenCalledOnce()
  })
})
