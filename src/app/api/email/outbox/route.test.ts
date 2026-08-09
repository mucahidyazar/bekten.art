import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({dispatchBatch: vi.fn()}))

vi.mock('@/server/email/configured-outbox-dispatcher', () => ({
  getConfiguredOutboxDispatcher: () => ({dispatchBatch: mocks.dispatchBatch}),
}))

import {POST} from './route'

describe('POST /api/email/outbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('OUTBOX_DISPATCH_SECRET', 's'.repeat(48))
    mocks.dispatchBatch.mockResolvedValue({completed: 2, failed: 0, retrying: 1})
  })

  it('rejects missing or invalid bearer authorization', async () => {
    const missing = await POST(
      new Request('https://bekten.art/api/email/outbox', {method: 'POST'}),
    )
    const invalid = await POST(
      new Request('https://bekten.art/api/email/outbox', {
        headers: {authorization: `Bearer ${'x'.repeat(48)}`},
        method: 'POST',
      }),
    )

    expect(missing.status).toBe(401)
    expect(invalid.status).toBe(401)
    expect(mocks.dispatchBatch).not.toHaveBeenCalled()
  })

  it('dispatches a bounded batch for an authorized scheduler', async () => {
    const response = await POST(
      new Request('https://bekten.art/api/email/outbox', {
        headers: {authorization: `Bearer ${'s'.repeat(48)}`},
        method: 'POST',
      }),
    )

    expect(response.status).toBe(200)
    expect(mocks.dispatchBatch).toHaveBeenCalledWith(10)
    expect(await response.json()).toEqual({
      data: {completed: 2, failed: 0, retrying: 1},
      success: true,
    })
  })
})
