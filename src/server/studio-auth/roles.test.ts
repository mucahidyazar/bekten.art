import {describe, expect, it, vi} from 'vitest'

import {
  StudioAuthenticationRequiredError,
  StudioEditorRequiredError,
  StudioOwnerRequiredError,
  createStudioAccess,
  isStudioEditorRole,
  isStudioOwnerRole,
} from './roles'

const session = {
  expires: '2026-08-10T18:00:00.000Z',
  user: {id: 'user-1'},
}

describe('Studio roles', () => {
  it.each(['EDITOR', 'OWNER', 'ADMIN'])(
    'allows %s to enter Studio during the ADMIN compatibility window',
    role => {
      expect(isStudioEditorRole(role)).toBe(true)
    },
  )

  it.each(['OWNER', 'ADMIN'])(
    'allows %s to perform owner operations',
    role => {
      expect(isStudioOwnerRole(role)).toBe(true)
    },
  )

  it.each(['USER', 'ARTIST', '', undefined, null])(
    'rejects non-Studio role %s',
    role => {
      expect(isStudioEditorRole(role)).toBe(false)
      expect(isStudioOwnerRole(role)).toBe(false)
    },
  )
})

describe('Studio access guards', () => {
  it('authorizes with the current database role, not a session role claim', async () => {
    const access = createStudioAccess({
      findUserById: vi
        .fn()
        .mockResolvedValue({
          id: 'user-1',
          role: 'EDITOR',
          studioStatus: 'ACTIVE',
        }),
      getSession: vi.fn().mockResolvedValue({
        ...session,
        user: {...session.user, role: 'USER'},
      }),
    })

    await expect(access.requireEditor()).resolves.toEqual({
      id: 'user-1',
      role: 'EDITOR',
      studioStatus: 'ACTIVE',
    })
  })

  it('rejects missing sessions before querying the database', async () => {
    const findUserById = vi.fn()
    const access = createStudioAccess({
      findUserById,
      getSession: vi.fn().mockResolvedValue(null),
    })

    await expect(access.requireEditor()).rejects.toBeInstanceOf(
      StudioAuthenticationRequiredError,
    )
    expect(findUserById).not.toHaveBeenCalled()
  })

  it('rejects a current non-editor database role', async () => {
    const access = createStudioAccess({
      findUserById: vi
        .fn()
        .mockResolvedValue({
          id: 'user-1',
          role: 'USER',
          studioStatus: 'ACTIVE',
        }),
      getSession: vi.fn().mockResolvedValue(session),
    })

    await expect(access.requireEditor()).rejects.toBeInstanceOf(
      StudioEditorRequiredError,
    )
  })

  it('rejects a suspended editor even when its database role is retained', async () => {
    const access = createStudioAccess({
      findUserById: vi
        .fn()
        .mockResolvedValue({
          id: 'user-1',
          role: 'EDITOR',
          studioStatus: 'SUSPENDED',
        }),
      getSession: vi.fn().mockResolvedValue(session),
    })

    await expect(access.requireEditor()).rejects.toBeInstanceOf(
      StudioEditorRequiredError,
    )
  })

  it('keeps owner-only operations explicit', async () => {
    const access = createStudioAccess({
      findUserById: vi
        .fn()
        .mockResolvedValue({
          id: 'user-1',
          role: 'EDITOR',
          studioStatus: 'ACTIVE',
        }),
      getSession: vi.fn().mockResolvedValue(session),
    })

    await expect(access.requireOwner()).rejects.toBeInstanceOf(
      StudioOwnerRequiredError,
    )
  })
})
