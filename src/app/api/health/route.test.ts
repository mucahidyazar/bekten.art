import {describe, expect, it} from 'vitest'

import {GET} from './route'

describe('GET /api/health', () => {
  it('returns an external-dependency-free liveness response', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('no-store')
    await expect(response.json()).resolves.toEqual({status: 'ok'})
  })
})
