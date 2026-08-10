import {createHmac} from 'node:crypto'

import {describe, expect, it} from 'vitest'

import {
  signEditorialPreviewToken,
  verifyEditorialPreviewToken,
} from './preview-token'

const actorUserId = '084df664-a286-4cfa-bc4c-5021aaeaeb31'
const entityId = '9973ebcd-581d-427f-a23a-9e77fb008f52'
const now = new Date('2026-08-10T12:00:00.000Z')
const nowSeconds = Math.floor(now.getTime() / 1000)
const secret = 'preview-secret-with-at-least-32-characters'

const tokenInput = {
  actorRole: 'EDITOR' as const,
  actorUserId,
  entityId,
  entityType: 'ARTWORK' as const,
}

function signedRawClaims(claims: Record<string, unknown>) {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  const signingInput = `v1.${payload}`
  const signature = createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64url')

  return `${signingInput}.${signature}`
}

describe('editorial preview token signing', () => {
  it.each(['ADMIN', 'EDITOR', 'OWNER'] as const)(
    'round-trips strict %s Studio claims in an opaque base64url token',
    actorRole => {
      const token = signEditorialPreviewToken(
        {...tokenInput, actorRole},
        secret,
        {now},
      )
      const authorization = verifyEditorialPreviewToken(token, secret, now)

      expect(token).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
      expect(authorization).toMatchObject({
        actorRole,
        actorUserId,
        entityId,
        entityType: 'ARTWORK',
        expiresAt: new Date('2026-08-10T12:15:00.000Z'),
      })
      expect(Object.isFrozen(authorization)).toBe(true)
    },
  )

  it.each([
    {label: 'short secret', secret: 'too-short'},
    {label: 'empty secret', secret: ''},
  ])('rejects a $label', ({secret: invalidSecret}) => {
    expect(() =>
      signEditorialPreviewToken(tokenInput, invalidSecret, {now}),
    ).toThrow()
    expect(() =>
      verifyEditorialPreviewToken('v1.payload.signature', invalidSecret, now),
    ).toThrow()
  })

  it.each([
    {actorRole: 'USER'},
    {actorUserId: 'not-a-uuid'},
    {entityId: 'not-a-uuid'},
    {entityType: 'UNKNOWN'},
  ])('rejects invalid signer input: %o', overrides => {
    expect(() =>
      signEditorialPreviewToken(
        {...tokenInput, ...overrides} as typeof tokenInput,
        secret,
        {now},
      ),
    ).toThrow()
  })

  it.each([0, -1, 901, 1.5])('rejects an unsafe TTL: %s', ttlSeconds => {
    expect(() =>
      signEditorialPreviewToken(tokenInput, secret, {now, ttlSeconds}),
    ).toThrow()
  })
})

describe('editorial preview token verification', () => {
  it('rejects expired tokens at the exact expiry boundary', () => {
    const token = signEditorialPreviewToken(tokenInput, secret, {
      now,
      ttlSeconds: 60,
    })

    expect(
      verifyEditorialPreviewToken(
        token,
        secret,
        new Date('2026-08-10T12:00:59.999Z'),
      ),
    ).not.toBeNull()
    expect(
      verifyEditorialPreviewToken(
        token,
        secret,
        new Date('2026-08-10T12:01:00.000Z'),
      ),
    ).toBeNull()
  })

  it.each([
    'v1.payload',
    'v2.payload.signature',
    'v1.payload.signature.extra',
    'v1.pay=load.signature',
    'v1..signature',
    `v1.${'a'.repeat(4097)}.signature`,
  ])('rejects a malformed token: %s', token => {
    expect(verifyEditorialPreviewToken(token, secret, now)).toBeNull()
  })

  it('rejects tampered payloads, signatures and the wrong secret', () => {
    const token = signEditorialPreviewToken(tokenInput, secret, {now})
    const [version, payload, signature] = token.split('.')
    const tamperedPayload = `${payload?.slice(0, -1)}A`
    const tamperedSignature = `${signature?.slice(0, -1)}A`

    expect(
      verifyEditorialPreviewToken(
        `${version}.${tamperedPayload}.${signature}`,
        secret,
        now,
      ),
    ).toBeNull()
    expect(
      verifyEditorialPreviewToken(
        `${version}.${payload}.${tamperedSignature}`,
        secret,
        now,
      ),
    ).toBeNull()
    expect(
      verifyEditorialPreviewToken(
        token,
        'a-different-preview-secret-over-32-chars',
        now,
      ),
    ).toBeNull()
  })

  it.each([
    {
      actorRole: 'USER',
      actorUserId,
      entityId,
      entityType: 'ARTWORK',
      exp: nowSeconds + 60,
      iat: nowSeconds,
    },
    {
      actorRole: 'EDITOR',
      actorUserId,
      entityId,
      entityType: 'ARTWORK',
      exp: nowSeconds + 901,
      iat: nowSeconds,
    },
    {
      actorRole: 'EDITOR',
      actorUserId,
      entityId,
      entityType: 'ARTWORK',
      exp: nowSeconds + 60,
      extra: 'not-allowed',
      iat: nowSeconds,
    },
    {
      actorRole: 'EDITOR',
      actorUserId,
      entityId,
      entityType: 'ARTWORK',
      exp: nowSeconds + 120,
      iat: nowSeconds + 60,
    },
  ])('rejects signed but invalid claims: %o', claims => {
    expect(
      verifyEditorialPreviewToken(signedRawClaims(claims), secret, now),
    ).toBeNull()
  })
})
