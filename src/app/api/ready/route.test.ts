import {beforeEach, describe, expect, it, vi} from 'vitest'

const {checkReadinessMock} = vi.hoisted(() => ({
  checkReadinessMock: vi.fn(),
}))

vi.mock('../../../server/operations/health/readiness', () => ({
  checkReadiness: checkReadinessMock,
}))

import {GET} from './route'

const checks = {
  configuration: 'ok',
  database: 'ok',
  email: 'ok',
  objectStorage: 'ok',
} as const

describe('GET /api/ready', () => {
  beforeEach(() => {
    checkReadinessMock.mockReset()
  })

  it('returns 200 and no-store when every production dependency is ready', async () => {
    checkReadinessMock.mockResolvedValue({checks, status: 'ready'})

    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('no-store')
    await expect(response.json()).resolves.toEqual({checks, status: 'ready'})
  })

  it('returns 503 without provider error details when a dependency is unavailable', async () => {
    checkReadinessMock.mockResolvedValue({
      checks: {...checks, objectStorage: 'error'},
      status: 'not_ready',
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(body).toEqual({
      checks: {...checks, objectStorage: 'error'},
      status: 'not_ready',
    })
    expect(JSON.stringify(body)).not.toMatch(/secret|credential|provider/i)
  })

  it('fails closed if the readiness orchestration throws unexpectedly', async () => {
    checkReadinessMock.mockRejectedValue(new Error('postgres password leaked'))

    const response = await GET()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      checks: {
        configuration: 'error',
        database: 'error',
        email: 'error',
        objectStorage: 'error',
      },
      status: 'not_ready',
    })
  })
})
