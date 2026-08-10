import {describe, expect, it} from 'vitest'

import {
  canAccessEditorialPreview,
  selectPublicSnapshot,
  selectStudioPreviewSnapshot,
} from './access'
import {
  signEditorialPreviewToken,
  verifyEditorialPreviewToken,
} from './preview-token'

import type {VerifiedEditorialPreviewAuthorization} from './preview-token'

const now = new Date('2026-08-10T12:00:00.000Z')
const previewSecret = 'preview-secret-with-at-least-32-characters'

function aggregate(overrides: Record<string, unknown> = {}) {
  return {
    draftSnapshot: {title: 'Unpublished title'},
    entityId: '9973ebcd-581d-427f-a23a-9e77fb008f52',
    entityType: 'ARTWORK' as const,
    locale: 'en' as const,
    publishedAt: new Date('2026-08-09T12:00:00.000Z'),
    publishedSnapshot: {title: 'Published title'},
    slug: 'silent-steppe',
    status: 'PUBLISHED' as const,
    version: 3,
    ...overrides,
  }
}

function preview(
  overrides: Record<string, unknown> = {},
): VerifiedEditorialPreviewAuthorization {
  const token = signEditorialPreviewToken(
    {
      actorRole: 'EDITOR' as const,
      actorUserId: '084df664-a286-4cfa-bc4c-5021aaeaeb31',
      entityId: '9973ebcd-581d-427f-a23a-9e77fb008f52',
      entityType: 'ARTWORK' as const,
      ...overrides,
    } as Parameters<typeof signEditorialPreviewToken>[0],
    previewSecret,
    {now, ttlSeconds: 300},
  )
  const authorization = verifyEditorialPreviewToken(token, previewSecret, now)

  if (!authorization) throw new Error('Expected a verified preview token')

  return authorization
}

describe('editorial public visibility', () => {
  it('exposes only the immutable published snapshot', () => {
    const content = aggregate()
    const selected = selectPublicSnapshot(content, now)

    expect(selected).toEqual({title: 'Published title'})
    expect(selected).not.toBe(content.publishedSnapshot)
    expect(Object.isFrozen(selected)).toBe(true)
    expect(selected).not.toEqual(content.draftSnapshot)
  })

  it.each([
    {publishedSnapshot: null},
    {status: 'DRAFT'},
    {status: 'ARCHIVED'},
    {publishedAt: null},
    {publishedAt: new Date('invalid')},
    {publishedAt: new Date('2026-08-11T12:00:00.000Z')},
  ])('hides a non-public aggregate: %o', overrides => {
    expect(selectPublicSnapshot(aggregate(overrides), now)).toBeNull()
  })
})

describe('editorial signed preview access', () => {
  it.each(['EDITOR', 'OWNER', 'ADMIN'] as const)(
    'accepts a valid, unexpired %s Studio grant',
    actorRole => {
      expect(
        canAccessEditorialPreview(preview({actorRole}), aggregate(), now),
      ).toBe(true)
    },
  )

  it.each([
    {entityId: 'a0a5845e-f8f8-4c93-b2ec-7ee76300fc41'},
    {entityType: 'COLLECTION'},
  ])('rejects an invalid preview grant: %o', overrides => {
    expect(
      canAccessEditorialPreview(preview(overrides), aggregate(), now),
    ).toBe(false)
  })

  it('returns only the draft snapshot to an authorized Studio preview', () => {
    const content = aggregate()
    const selected = selectStudioPreviewSnapshot(content, preview(), now)

    expect(selected).toEqual({title: 'Unpublished title'})
    expect(selected).not.toBe(content.draftSnapshot)
    expect(Object.isFrozen(selected)).toBe(true)
  })

  it('fails closed instead of falling back to public content', () => {
    const verified = preview()
    const forged = {
      actorRole: verified.actorRole,
      actorUserId: verified.actorUserId,
      entityId: verified.entityId,
      entityType: verified.entityType,
      expiresAt: verified.expiresAt,
    } as VerifiedEditorialPreviewAuthorization

    expect(() => selectStudioPreviewSnapshot(aggregate(), forged, now)).toThrow(
      'Preview access denied',
    )
  })

  it('rechecks expiry when a verified grant is used later', () => {
    const authorization = preview()

    expect(
      canAccessEditorialPreview(
        authorization,
        aggregate(),
        new Date('2026-08-10T12:05:00.000Z'),
      ),
    ).toBe(false)
  })
})
