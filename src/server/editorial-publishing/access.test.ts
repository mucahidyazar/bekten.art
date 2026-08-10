import {describe, expect, it} from 'vitest'

import {
  canAccessEditorialPreview,
  selectPublicSnapshot,
  selectStudioPreviewSnapshot,
} from './access'

const now = new Date('2026-08-10T12:00:00.000Z')

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

function preview(overrides: Record<string, unknown> = {}) {
  return {
    actorRole: 'EDITOR' as const,
    actorUserId: '084df664-a286-4cfa-bc4c-5021aaeaeb31',
    entityId: '9973ebcd-581d-427f-a23a-9e77fb008f52',
    entityType: 'ARTWORK' as const,
    expiresAt: new Date('2026-08-10T12:05:00.000Z'),
    signatureVerified: true,
    ...overrides,
  }
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
    {actorRole: 'USER'},
    {signatureVerified: false},
    {expiresAt: now},
    {expiresAt: new Date('2026-08-10T11:59:59.999Z')},
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
    expect(() =>
      selectStudioPreviewSnapshot(
        aggregate(),
        preview({signatureVerified: false}),
        now,
      ),
    ).toThrow('Preview access denied')
  })
})
