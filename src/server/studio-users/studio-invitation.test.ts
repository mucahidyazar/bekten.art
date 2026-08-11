import {describe, expect, it} from 'vitest'

import {createStudioInvitation} from './studio-invitation'

describe('Studio invitation material', () => {
  it('stores only a token hash and an authenticated encrypted callback URL', () => {
    const invitation = createStudioInvitation({
      appUrl: 'http://localhost:3000',
      email: 'editor@example.com',
      now: new Date('2026-08-11T12:00:00.000Z'),
      secret: 's'.repeat(64),
    })

    expect(invitation.verification.token).toMatch(/^[a-f0-9]{64}$/u)
    expect(invitation.outbox.type).toBe('studio.magic-link.requested')
    expect(invitation.outbox.payload.signInUrlEncrypted).toMatch(/^v1\./u)
    expect(JSON.stringify(invitation)).not.toContain('callback/email?')
    expect(JSON.stringify(invitation)).not.toContain('token=')
    expect(invitation.outbox.payload.to).toBe('editor@example.com')
  })
})
