import {describe, expect, it, vi} from 'vitest'

import {
  AdminAccessRequiredError,
  AuthenticationRequiredError,
  RecentAuthenticationRequiredError,
  ResourceAccessDeniedError,
  createAuthAccess,
} from './access'

const admin = {
  id: 'user-1',
  role: 'ADMIN' as const,
}

describe('auth access guards', () => {
  it('uses the database role instead of trusting a session role claim', async () => {
    const access = createAuthAccess({
      findUserById: vi.fn().mockResolvedValue({...admin, role: 'USER'}),
      getSession: vi.fn().mockResolvedValue({
        expires: '2099-01-01T00:00:00.000Z',
        user: {...admin, email: 'admin@example.com'},
      }),
    })

    await expect(access.requireAdminUser()).rejects.toBeInstanceOf(
      AdminAccessRequiredError,
    )
  })

  it('returns the current database user to an authenticated request', async () => {
    const findUserById = vi.fn().mockResolvedValue(admin)
    const access = createAuthAccess({
      findUserById,
      getSession: vi.fn().mockResolvedValue({
        expires: '2099-01-01T00:00:00.000Z',
        user: {...admin, email: 'admin@example.com'},
      }),
    })

    await expect(access.requireAdminUser()).resolves.toEqual(admin)
    expect(findUserById).toHaveBeenCalledWith('user-1')
  })

  it('does not query a user when the session has no stable user id', async () => {
    const findUserById = vi.fn()
    const access = createAuthAccess({
      findUserById,
      getSession: vi.fn().mockResolvedValue(null),
    })

    await expect(access.requireAuthenticatedUser()).rejects.toBeInstanceOf(
      AuthenticationRequiredError,
    )
    expect(findUserById).not.toHaveBeenCalled()
  })

  it.each([
    [{id: 'owner-1', role: 'USER'}, 'owner-1'],
    [{id: 'admin-1', role: 'ADMIN'}, 'owner-1'],
  ])('allows an owner or a current database admin', async (user, ownerId) => {
    const access = createAuthAccess({
      findUserById: vi.fn().mockResolvedValue(user),
      getSession: vi.fn().mockResolvedValue({
        expires: '2099-01-01T00:00:00.000Z',
        user: {...user, email: 'user@example.com'},
      }),
    })

    await expect(access.requireOwnerOrAdminUser(ownerId)).resolves.toEqual(user)
  })

  it('rejects an authenticated user accessing another owner resource', async () => {
    const access = createAuthAccess({
      findUserById: vi.fn().mockResolvedValue({id: 'user-1', role: 'USER'}),
      getSession: vi.fn().mockResolvedValue({
        expires: '2099-01-01T00:00:00.000Z',
        user: {email: 'user@example.com', id: 'user-1', role: 'USER'},
      }),
    })

    await expect(
      access.requireOwnerOrAdminUser('owner-2'),
    ).rejects.toBeInstanceOf(ResourceAccessDeniedError)
  })

  it('requires a recent session-specific sign-in for privileged mutations', async () => {
    const now = new Date('2026-08-09T12:00:00.000Z')
    const access = createAuthAccess({
      findUserById: vi.fn().mockResolvedValue({
        ...admin,
      }),
      getSession: vi.fn().mockResolvedValue({
        expires: '2099-01-01T00:00:00.000Z',
        user: {
          ...admin,
          authenticatedAt: new Date('2026-08-09T10:00:00.000Z').valueOf() / 1_000,
          email: 'admin@example.com',
        },
      }),
      now: () => now,
      recentAuthenticationMaxAgeMs: 30 * 60 * 1_000,
    })

    await expect(access.requireRecentAdminUser()).rejects.toBeInstanceOf(
      RecentAuthenticationRequiredError,
    )
  })

  it('accepts a recently authenticated database admin', async () => {
    const user = {
      ...admin,
    }
    const access = createAuthAccess({
      findUserById: vi.fn().mockResolvedValue(user),
      getSession: vi.fn().mockResolvedValue({
        expires: '2099-01-01T00:00:00.000Z',
        user: {
          ...admin,
          authenticatedAt: new Date('2026-08-09T11:45:00.000Z').valueOf() / 1_000,
          email: 'admin@example.com',
        },
      }),
      now: () => new Date('2026-08-09T12:00:00.000Z'),
      recentAuthenticationMaxAgeMs: 30 * 60 * 1_000,
    })

    await expect(access.requireRecentAdminUser()).resolves.toEqual(user)
  })
})
