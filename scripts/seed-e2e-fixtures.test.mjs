import {describe, expect, it, vi} from 'vitest'

import {
  assertE2EFixturesAllowed,
  seedE2EFixtures,
} from './seed-e2e-fixtures.mjs'

describe('isolated E2E fixture seed', () => {
  it('requires an explicit test-only confirmation', () => {
    expect(() =>
      assertE2EFixturesAllowed({
        E2E_FIXTURES_CONFIRMATION: 'bekten-art-e2e-fixtures',
        NODE_ENV: 'test',
      }),
    ).not.toThrow()
    expect(() => assertE2EFixturesAllowed({NODE_ENV: 'test'})).toThrow(
      'E2E_FIXTURES_NOT_AUTHORIZED',
    )
    expect(() =>
      assertE2EFixturesAllowed({
        E2E_FIXTURES_CONFIRMATION: 'bekten-art-e2e-fixtures',
        NODE_ENV: 'production',
      }),
    ).toThrow('E2E_FIXTURES_NOT_AUTHORIZED')
  })

  it('seeds deterministic editorial fixtures without contacting Garage', async () => {
    const database = {
      $disconnect: vi.fn(),
    }
    const executeSeed = vi.fn().mockResolvedValue({
      created: 12,
      existing: 0,
      media: 8,
    })

    await expect(
      seedE2EFixtures({
        database,
        environment: {
          E2E_FIXTURES_CONFIRMATION: 'bekten-art-e2e-fixtures',
          NODE_ENV: 'test',
        },
        executeSeed,
      }),
    ).resolves.toMatchObject({created: 12, media: 8})
    expect(executeSeed).toHaveBeenCalledWith(
      expect.objectContaining({
        database,
        uploadAsset: expect.any(Function),
      }),
    )

    await expect(
      executeSeed.mock.calls[0][0].uploadAsset({objectKey: 'ignored'}),
    ).resolves.toBeUndefined()
  })
})
