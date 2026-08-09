import {describe, expect, it} from 'vitest'

import {
  applySessionClaims,
  enrichJwtClaims,
  refreshJwtClaims,
  sanitizeRedirectPath,
} from './session-utils'

describe('sanitizeRedirectPath', () => {
  it('keeps valid internal paths', () => {
    expect(sanitizeRedirectPath('/admin?tab=users')).toBe('/admin?tab=users')
  })

  it('rejects external absolute urls', () => {
    expect(sanitizeRedirectPath('https://evil.example/steal')).toBe('/')
  })

  it('rejects protocol-relative urls', () => {
    expect(sanitizeRedirectPath('//evil.example/steal')).toBe('/')
  })

  it('rejects malformed relative paths without leading slash', () => {
    expect(sanitizeRedirectPath('profile')).toBe('/')
  })
})

describe('enrichJwtClaims', () => {
  it('copies signed-in user claims into the token', () => {
    expect(
      enrichJwtClaims(
        {sub: undefined},
        {
          id: 'user-1',
          passwordResetRequired: true,
          role: 'ADMIN',
          sessionVersion: 3,
        },
      ),
    ).toMatchObject({
      passwordResetRequired: true,
      role: 'ADMIN',
      sessionVersion: 3,
      sub: 'user-1',
    })
  })

  it('preserves the existing token when no user payload is present', () => {
    expect(enrichJwtClaims({role: 'USER', sub: 'user-1'}, undefined)).toEqual({
      role: 'USER',
      sub: 'user-1',
    })
  })

  it('refreshes claims from a current database snapshot', () => {
    expect(
      enrichJwtClaims(
        {passwordResetRequired: false, role: 'ADMIN', sub: 'user-1'},
        {
          id: 'user-1',
          passwordResetRequired: true,
          role: 'USER',
          sessionVersion: 2,
        },
      ),
    ).toMatchObject({
      passwordResetRequired: true,
      role: 'USER',
      sessionVersion: 2,
      sub: 'user-1',
    })
  })
})

describe('applySessionClaims', () => {
  it('maps jwt claims onto the session user', () => {
    const session = applySessionClaims(
      {
        expires: '2099-01-01T00:00:00.000Z',
        user: {
          email: 'artist@example.com',
          id: '',
          name: 'Artist',
        },
      },
      {
        authTime: 1_786_276_800,
        passwordResetRequired: true,
        role: 'ARTIST',
        sub: 'user-1',
      },
    )

    expect(session.user).toMatchObject({
      id: 'user-1',
      authenticatedAt: 1_786_276_800,
      passwordResetRequired: true,
      role: 'ARTIST',
    })
  })

  it('falls back to USER when the token role is unknown', () => {
    const session = applySessionClaims(
      {
        expires: '2099-01-01T00:00:00.000Z',
        user: {
          email: 'artist@example.com',
          id: '',
        },
      },
      {
        role: 'UNKNOWN' as never,
        sub: 'user-1',
      },
    )

    expect(session.user?.role).toBe('USER')
  })
})

describe('refreshJwtClaims', () => {
  it('reloads authorization claims for an existing JWT session', async () => {
    await expect(
      refreshJwtClaims(
        {
          passwordResetRequired: false,
          role: 'ADMIN',
          sessionVersion: 0,
          sub: 'user-1',
        },
        undefined,
        async () => ({
          id: 'user-1',
          passwordResetRequired: true,
          role: 'USER',
          sessionVersion: 0,
        }),
      ),
    ).resolves.toMatchObject({
      passwordResetRequired: true,
      role: 'USER',
      sessionVersion: 0,
      sub: 'user-1',
    })
  })

  it('invalidates the stable subject when the database user was removed', async () => {
    await expect(
      refreshJwtClaims(
        {role: 'ADMIN', sub: 'deleted-user'},
        undefined,
        async () => null,
      ),
    ).resolves.toMatchObject({role: 'USER', sub: undefined})
  })

  it('invalidates an existing JWT after the database session version changes', async () => {
    await expect(
      refreshJwtClaims(
        {role: 'ADMIN', sessionVersion: 2, sub: 'user-1'},
        undefined,
        async () => ({
          id: 'user-1',
          passwordResetRequired: false,
          role: 'ADMIN',
          sessionVersion: 3,
        }),
      ),
    ).resolves.toMatchObject({
      role: 'USER',
      sessionVersion: undefined,
      sub: undefined,
    })
  })

  it('builds the initial token directly from the signed-in user', async () => {
    let databaseCalled = false
    const token = await refreshJwtClaims(
      {},
      {
        id: 'user-1',
        passwordResetRequired: false,
        role: 'ARTIST',
        sessionVersion: 0,
      },
      async () => {
        databaseCalled = true

        return null
      },
    )

    expect(token).toMatchObject({
      role: 'ARTIST',
      sessionVersion: 0,
      sub: 'user-1',
    })
    expect(databaseCalled).toBe(false)
  })
})
