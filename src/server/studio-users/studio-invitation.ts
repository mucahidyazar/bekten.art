import {randomBytes} from 'node:crypto'

import {hashStudioVerificationToken} from '@/server/studio-auth/magic-link-coordinator'
import {createStudioMagicLinkSealer} from '@/server/studio-auth/sealed-link'

type StudioInvitationInput = Readonly<{
  appUrl: string
  email: string
  now?: Date
  secret: string
}>

export function createStudioInvitation({
  appUrl,
  email,
  now = new Date(),
  secret,
}: StudioInvitationInput) {
  const origin = new URL(appUrl).origin
  const expires = new Date(now.getTime() + 10 * 60_000)
  const rawToken = randomBytes(32).toString('base64url')
  const tokenHash = hashStudioVerificationToken(rawToken, secret)
  const callbackUrl = new URL('/api/auth/callback/email', origin)

  callbackUrl.searchParams.set('callbackUrl', `${origin}/dashboard`)
  callbackUrl.searchParams.set('email', email)
  callbackUrl.searchParams.set('token', rawToken)

  return Object.freeze({
    outbox: Object.freeze({
      idempotencyKey: `studio.magic-link:${tokenHash}`,
      payload: Object.freeze({
        expiresAt: expires.toISOString(),
        signInUrlEncrypted:
          createStudioMagicLinkSealer(secret).seal(callbackUrl.toString()),
        to: email,
      }),
      type: 'studio.magic-link.requested' as const,
    }),
    verification: Object.freeze({
      expires,
      identifier: email,
      token: tokenHash,
    }),
  })
}
