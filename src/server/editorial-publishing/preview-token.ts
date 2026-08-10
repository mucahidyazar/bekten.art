import {createHmac, timingSafeEqual} from 'node:crypto'

import {z} from 'zod'

import type {EditorialEntityReference, EditorialEntityType} from './contracts'

const MAX_PREVIEW_TOKEN_LENGTH = 4096
const MAX_PREVIEW_TOKEN_TTL_SECONDS = 15 * 60
const base64UrlSegmentPattern = /^[A-Za-z0-9_-]+$/
const entityTypeSchema = z.enum([
  'ARTWORK',
  'COLLECTION',
  'EXHIBITION',
  'JOURNAL_ENTRY',
  'PAGE',
  'PRESS_ENTRY',
])
const previewRoleSchema = z.enum(['ADMIN', 'EDITOR', 'OWNER'])
const previewSecretSchema = z.string().min(32).max(1024)
const previewTokenClaimsSchema = z
  .object({
    actorRole: previewRoleSchema,
    actorUserId: z.string().uuid(),
    entityId: z.string().uuid(),
    entityType: entityTypeSchema,
    exp: z.number().int().positive(),
    iat: z.number().int().nonnegative(),
  })
  .strict()
const previewTokenInputSchema = previewTokenClaimsSchema.omit({
  exp: true,
  iat: true,
})
const previewTokenSigningOptionsSchema = z
  .object({
    now: z.date().default(() => new Date()),
    ttlSeconds: z
      .number()
      .int()
      .positive()
      .max(MAX_PREVIEW_TOKEN_TTL_SECONDS)
      .default(MAX_PREVIEW_TOKEN_TTL_SECONDS),
  })
  .strict()
const verifiedAuthorizationBrand = Symbol('verified-editorial-preview')

export type EditorialPreviewRole = z.infer<typeof previewRoleSchema>

export type EditorialPreviewTokenInput = EditorialEntityReference &
  Readonly<{
    actorRole: EditorialPreviewRole
    actorUserId: string
  }>

export type EditorialPreviewTokenSigningOptions = Readonly<{
  now?: Date
  ttlSeconds?: number
}>

export type VerifiedEditorialPreviewAuthorization = Readonly<{
  actorRole: EditorialPreviewRole
  actorUserId: string
  entityId: string
  entityType: EditorialEntityType
  expiresAt: Date
  [verifiedAuthorizationBrand]: true
}>

function decodeCanonicalBase64Url(segment: string): Buffer | null {
  if (!segment || !base64UrlSegmentPattern.test(segment)) return null

  const decoded = Buffer.from(segment, 'base64url')

  return decoded.toString('base64url') === segment ? decoded : null
}

function isTemporallyValid(
  claims: z.output<typeof previewTokenClaimsSchema>,
  now: Date,
): boolean {
  const nowMilliseconds = now.getTime()

  if (!Number.isFinite(nowMilliseconds)) return false

  const nowSeconds = Math.floor(nowMilliseconds / 1000)
  const ttlSeconds = claims.exp - claims.iat

  return (
    claims.iat <= nowSeconds &&
    claims.exp > nowSeconds &&
    ttlSeconds > 0 &&
    ttlSeconds <= MAX_PREVIEW_TOKEN_TTL_SECONDS
  )
}

function signedInput(payload: string) {
  return `v1.${payload}`
}

function signatureFor(input: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(input).digest()
}

function toVerifiedAuthorization(
  claims: z.output<typeof previewTokenClaimsSchema>,
): VerifiedEditorialPreviewAuthorization {
  const authorization = {
    actorRole: claims.actorRole,
    actorUserId: claims.actorUserId,
    entityId: claims.entityId,
    entityType: claims.entityType,
    expiresAt: new Date(claims.exp * 1000),
  }

  Object.defineProperty(authorization, verifiedAuthorizationBrand, {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false,
  })

  return Object.freeze(authorization) as VerifiedEditorialPreviewAuthorization
}

export function isVerifiedEditorialPreviewAuthorization(
  value: unknown,
): value is VerifiedEditorialPreviewAuthorization {
  return (
    typeof value === 'object' &&
    value !== null &&
    Reflect.get(value, verifiedAuthorizationBrand) === true
  )
}

export function signEditorialPreviewToken(
  input: EditorialPreviewTokenInput,
  secretInput: string,
  optionsInput: EditorialPreviewTokenSigningOptions = {},
): string {
  const secret = previewSecretSchema.parse(secretInput)
  const inputClaims = previewTokenInputSchema.parse(input)
  const options = previewTokenSigningOptionsSchema.parse(optionsInput)
  const issuedAt = Math.floor(options.now.getTime() / 1000)

  if (!Number.isFinite(issuedAt) || issuedAt < 0) {
    throw new TypeError('Preview token issue time must be valid')
  }

  const claims = previewTokenClaimsSchema.parse({
    ...inputClaims,
    exp: issuedAt + options.ttlSeconds,
    iat: issuedAt,
  })
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  const inputToSign = signedInput(payload)
  const signature = signatureFor(inputToSign, secret).toString('base64url')

  return `${inputToSign}.${signature}`
}

export function verifyEditorialPreviewToken(
  token: string,
  secretInput: string,
  now: Date = new Date(),
): VerifiedEditorialPreviewAuthorization | null {
  const secret = previewSecretSchema.parse(secretInput)

  if (
    typeof token !== 'string' ||
    token.length === 0 ||
    token.length > MAX_PREVIEW_TOKEN_LENGTH
  ) {
    return null
  }

  const segments = token.split('.')

  if (segments.length !== 3 || segments[0] !== 'v1') return null

  const payloadSegment = segments[1]
  const signatureSegment = segments[2]
  const payload = decodeCanonicalBase64Url(payloadSegment)
  const suppliedSignature = decodeCanonicalBase64Url(signatureSegment)

  if (!payload || !suppliedSignature) return null

  const expectedSignature = signatureFor(signedInput(payloadSegment), secret)

  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    return null
  }

  try {
    const parsedJson: unknown = JSON.parse(payload.toString('utf8'))
    const parsedClaims = previewTokenClaimsSchema.safeParse(parsedJson)

    if (!parsedClaims.success || !isTemporallyValid(parsedClaims.data, now)) {
      return null
    }

    return toVerifiedAuthorization(parsedClaims.data)
  } catch {
    return null
  }
}
