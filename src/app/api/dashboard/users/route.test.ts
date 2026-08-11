import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  command: vi.fn(),
  requireStudioOwner: vi.fn(),
}))

vi.mock('@/server/studio-auth/configured-access', () => ({
  requireStudioOwner: mocks.requireStudioOwner,
}))
vi.mock('@/server/studio-users/configured-studio-users', () => ({
  getConfiguredStudioUsers: () => ({command: mocks.command}),
}))

import {POST} from './route'

function request(body: unknown, origin = 'https://bekten.art') {
  const payload = JSON.stringify(body)

  return new Request('https://bekten.art/api/dashboard/users', {
    body: payload,
    headers: {
      'content-length': String(new TextEncoder().encode(payload).byteLength),
      'content-type': 'application/json',
      origin,
    },
    method: 'POST',
  })
}

describe('/api/dashboard/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bekten.art')
    mocks.requireStudioOwner.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      role: 'OWNER',
    })
    mocks.command.mockResolvedValue({id: 'user-1'})
  })

  it('rejects cross-origin requests before authentication', async () => {
    const response = await POST(
      request(
        {action: 'user.invite', email: 'editor@example.com', role: 'EDITOR'},
        'https://attacker.example',
      ),
    )

    expect(response.status).toBe(403)
    expect(mocks.requireStudioOwner).not.toHaveBeenCalled()
  })

  it('executes a bounded validated owner command', async () => {
    const command = {
      action: 'user.invite',
      email: 'editor@example.com',
      role: 'EDITOR',
    }
    const response = await POST(request(command))

    expect(response.status).toBe(200)
    expect(mocks.command).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      command,
    )
  })

  it('returns a safe conflict for final-owner and stale writes', async () => {
    mocks.command.mockRejectedValueOnce(new Error('STUDIO_LAST_OWNER_REQUIRED'))
    const response = await POST(
      request({
        action: 'user.status',
        id: '22222222-2222-4222-8222-222222222222',
        status: 'SUSPENDED',
        version: 1,
      }),
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: 'At least one active owner is required.',
    })
  })

  it('rejects malformed commands before service execution', async () => {
    const response = await POST(request({action: 'user.delete-all'}))

    expect(response.status).toBe(400)
    expect(mocks.command).not.toHaveBeenCalled()
  })
})
