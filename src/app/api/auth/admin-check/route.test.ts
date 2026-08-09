import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({requireAdminUser: vi.fn()}))

vi.mock('@/server/auth/access', () => {
  class AdminAccessRequiredError extends Error {}
  class AuthenticationRequiredError extends Error {}

  return {
    AdminAccessRequiredError,
    AuthenticationRequiredError,
    requireAdminUser: mocks.requireAdminUser,
  }
})

import {
  AdminAccessRequiredError,
  AuthenticationRequiredError,
} from '@/server/auth/access'

import {GET} from './route'

describe('GET /api/auth/admin-check', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a private non-cached admin identity', async () => {
    mocks.requireAdminUser.mockResolvedValue({id: 'admin-id', role: 'ADMIN'})

    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    await expect(response.json()).resolves.toEqual({
      error: null,
      isAdmin: true,
      userId: 'admin-id',
      userRole: 'ADMIN',
    })
  })

  it.each([
    [new AuthenticationRequiredError(), 401, 'Authentication required'],
    [new AdminAccessRequiredError(), 403, 'Access denied'],
  ])('maps expected authorization failures', async (error, status, message) => {
    mocks.requireAdminUser.mockRejectedValue(error)

    const response = await GET()

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({
      error: message,
      isAdmin: false,
    })
  })

  it('fails closed without leaking unexpected provider details', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    mocks.requireAdminUser.mockRejectedValue(
      new Error('database hostname and credential detail'),
    )

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload).toEqual({error: 'Unable to verify access', isAdmin: false})
    expect(JSON.stringify(payload)).not.toMatch(/hostname|credential/iu)
    expect(consoleError).toHaveBeenCalledWith('Admin authorization check failed')
  })
})
