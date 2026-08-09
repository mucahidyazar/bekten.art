import {describe, expect, it, vi} from 'vitest'

import {authorizeCredentials} from './credentials'

const passwordHash = '$2b$12$existing-hash'

describe('authorizeCredentials', () => {
  it('normalizes the identity and exposes only safe user fields', async () => {
    const findUserByEmail = vi.fn().mockResolvedValue({
      email: 'artist@example.com',
      emailVerified: new Date('2026-08-01T00:00:00.000Z'),
      id: 'user-1',
      image: null,
      name: 'Artist',
      passwordHash,
      passwordResetRequired: false,
      role: 'ARTIST',
      sessionVersion: 4,
    })

    await expect(
      authorizeCredentials(
        {email: ' ARTIST@Example.COM ', password: 'valid password'},
        {
          comparePassword: vi.fn().mockResolvedValue(true),
          findUserByEmail,
        },
      ),
    ).resolves.toEqual({
      email: 'artist@example.com',
      id: 'user-1',
      image: null,
      name: 'Artist',
      passwordResetRequired: false,
      role: 'ARTIST',
      sessionVersion: 4,
    })
    expect(findUserByEmail).toHaveBeenCalledWith('artist@example.com')
  })

  it.each([
    [{email: '', password: 'valid password'}],
    [{email: 'not-an-email', password: 'valid password'}],
    [{email: 'artist@example.com', password: ''}],
    [{email: 'artist@example.com', password: 'x'.repeat(1_025)}],
  ])('fails closed for malformed credentials', async credentials => {
    const findUserByEmail = vi.fn()

    await expect(
      authorizeCredentials(credentials, {
        comparePassword: vi.fn(),
        findUserByEmail,
      }),
    ).resolves.toBeNull()
    expect(findUserByEmail).not.toHaveBeenCalled()
  })

  it('uses a dummy password comparison for an unknown identity', async () => {
    const comparePassword = vi.fn().mockResolvedValue(false)

    await expect(
      authorizeCredentials(
        {email: 'missing@example.com', password: 'valid password'},
        {
          comparePassword,
          findUserByEmail: vi.fn().mockResolvedValue(null),
        },
      ),
    ).resolves.toBeNull()
    expect(comparePassword).toHaveBeenCalledOnce()
    expect(comparePassword.mock.calls[0]?.[1]).not.toBe('')
  })

  it('maps a wrong password to the same null result', async () => {
    await expect(
      authorizeCredentials(
        {email: 'artist@example.com', password: 'wrong password'},
        {
          comparePassword: vi.fn().mockResolvedValue(false),
          findUserByEmail: vi.fn().mockResolvedValue({
            email: 'artist@example.com',
            emailVerified: new Date('2026-08-01T00:00:00.000Z'),
            id: 'user-1',
            image: null,
            name: 'Artist',
            passwordHash,
            passwordResetRequired: false,
            role: 'ARTIST',
            sessionVersion: 0,
          }),
        },
      ),
    ).resolves.toBeNull()
  })

  it('rejects a credential account until its email is verified', async () => {
    await expect(
      authorizeCredentials(
        {email: 'artist@example.com', password: 'valid password'},
        {
          comparePassword: vi.fn().mockResolvedValue(true),
          findUserByEmail: vi.fn().mockResolvedValue({
            email: 'artist@example.com',
            emailVerified: null,
            id: 'user-1',
            image: null,
            name: 'Artist',
            passwordHash,
            passwordResetRequired: false,
            role: 'ARTIST',
            sessionVersion: 0,
          }),
        },
      ),
    ).resolves.toBeNull()
  })

  it('rejects a credential account that must reset its password', async () => {
    await expect(
      authorizeCredentials(
        {email: 'artist@example.com', password: 'valid password'},
        {
          comparePassword: vi.fn().mockResolvedValue(true),
          findUserByEmail: vi.fn().mockResolvedValue({
            email: 'artist@example.com',
            emailVerified: new Date('2026-08-01T00:00:00.000Z'),
            id: 'user-1',
            image: null,
            name: 'Artist',
            passwordHash,
            passwordResetRequired: true,
            role: 'ARTIST',
            sessionVersion: 0,
          }),
        },
      ),
    ).resolves.toBeNull()
  })
})
