import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({run: vi.fn()}))

vi.mock('@/server/operations/configured-retention', () => ({
  getConfiguredRetentionService: () => ({run: mocks.run}),
}))

import {POST} from './route'

describe('POST /api/operations/retention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('OUTBOX_DISPATCH_SECRET', 's'.repeat(48))
    mocks.run.mockResolvedValue({
      emailWebhookEvents: 1,
      feedback: 2,
      inquiries: 7,
      outboxJobs: 3,
      passwordResetTokens: 4,
      rateLimitBuckets: 5,
      sessions: 8,
      verificationTokens: 6,
    })
  })

  it('rejects unauthorized callers without running cleanup', async () => {
    const response = await POST(
      new Request('https://bekten.art/api/operations/retention', {
        method: 'POST',
      }),
    )

    expect(response.status).toBe(401)
    expect(response.headers.get('www-authenticate')).toBe('Bearer')
    expect(mocks.run).not.toHaveBeenCalled()
  })

  it('runs an authorized bounded cleanup', async () => {
    const response = await POST(
      new Request('https://bekten.art/api/operations/retention', {
        headers: {authorization: `Bearer ${'s'.repeat(48)}`},
        method: 'POST',
      }),
    )

    expect(response.status).toBe(200)
    expect(mocks.run).toHaveBeenCalledOnce()
    expect(await response.json()).toEqual({
      data: {
        emailWebhookEvents: 1,
        feedback: 2,
        inquiries: 7,
        outboxJobs: 3,
        passwordResetTokens: 4,
        rateLimitBuckets: 5,
        sessions: 8,
        verificationTokens: 6,
      },
      success: true,
    })
  })

  it('returns a generic error when cleanup fails', async () => {
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    mocks.run.mockRejectedValue(new Error('database details'))
    const response = await POST(
      new Request('https://bekten.art/api/operations/retention', {
        headers: {authorization: `Bearer ${'s'.repeat(48)}`},
        method: 'POST',
      }),
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Unable to complete retention cleanup',
      success: false,
    })
    expect(errorSpy).toHaveBeenCalledWith('Retention cleanup failed')
  })
})
