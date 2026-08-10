import {describe, expect, it, vi} from 'vitest'

import {createStudioAdapter} from './adapter'

import type {Adapter} from 'next-auth/adapters'

function baseAdapter(overrides: Partial<Adapter> = {}): Adapter {
  return {
    createUser: vi.fn(),
    getUser: vi.fn(),
    getUserByEmail: vi.fn(),
    getUserByAccount: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    linkAccount: vi.fn(),
    unlinkAccount: vi.fn(),
    createSession: vi.fn(),
    getSessionAndUser: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
    createVerificationToken: vi.fn(),
    useVerificationToken: vi.fn(),
    ...overrides,
  } as Adapter
}

describe('Studio NextAuth adapter', () => {
  it('revokes a database session when the current role is no longer authorized', async () => {
    const deleteSession = vi.fn().mockResolvedValue(undefined)
    const adapter = createStudioAdapter(
      baseAdapter({
        deleteSession,
        getSessionAndUser: vi.fn().mockResolvedValue({
          session: {
            expires: new Date('2026-08-11T00:00:00.000Z'),
            sessionToken: 'session-token',
            userId: 'user-1',
          },
          user: {id: 'user-1', role: 'USER'},
        }),
      }),
      {
        storeVerificationToken: vi.fn(),
      },
    )

    await expect(adapter.getSessionAndUser?.('session-token')).resolves.toBeNull()
    expect(deleteSession).toHaveBeenCalledWith('session-token')
  })

  it('keeps an editor database session active', async () => {
    const active = {
      session: {
        expires: new Date('2026-08-11T00:00:00.000Z'),
        sessionToken: 'session-token',
        userId: 'user-1',
      },
      user: {id: 'user-1', role: 'EDITOR'},
    }
    const adapter = createStudioAdapter(
      baseAdapter({getSessionAndUser: vi.fn().mockResolvedValue(active)}),
      {storeVerificationToken: vi.fn()},
    )

    await expect(adapter.getSessionAndUser?.('session-token')).resolves.toEqual(
      active,
    )
  })

  it('delegates the already-hashed NextAuth verification token to the coordinator', async () => {
    const stored = {
      expires: new Date('2026-08-10T12:10:00.000Z'),
      identifier: 'editor@example.com',
      token: 'a'.repeat(64),
    }
    const storeVerificationToken = vi.fn().mockResolvedValue(stored)
    const adapter = createStudioAdapter(baseAdapter(), {
      storeVerificationToken,
    })

    await expect(adapter.createVerificationToken?.(stored)).resolves.toEqual(
      stored,
    )
    expect(storeVerificationToken).toHaveBeenCalledWith(stored)
  })

  it('inherits one-use and replay rejection from the Prisma adapter', async () => {
    const useVerificationToken = vi
      .fn()
      .mockResolvedValueOnce({
        expires: new Date('2026-08-10T12:10:00.000Z'),
        identifier: 'editor@example.com',
        token: 'a'.repeat(64),
      })
      .mockResolvedValueOnce(null)
    const adapter = createStudioAdapter(
      baseAdapter({useVerificationToken}),
      {storeVerificationToken: vi.fn()},
    )

    const lookup = {identifier: 'editor@example.com', token: 'a'.repeat(64)}

    await expect(adapter.useVerificationToken?.(lookup)).resolves.toBeTruthy()
    await expect(adapter.useVerificationToken?.(lookup)).resolves.toBeNull()
  })
})
