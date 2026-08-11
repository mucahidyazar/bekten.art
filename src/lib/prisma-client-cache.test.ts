import {describe, expect, it, vi} from 'vitest'

import {selectPrismaClient} from './prisma-client-cache'

function client({current = true} = {}) {
  return {
    $disconnect: vi.fn().mockResolvedValue(undefined),
    ...(current
      ? {
          mediaFolder: {},
          siteLocale: {},
          uiTranslationOverride: {},
        }
      : {}),
  }
}

describe('Prisma development client cache', () => {
  it('reuses a generated client only when its schema signature and delegates match', () => {
    const cached = client()
    const create = vi.fn(() => client())

    expect(
      selectPrismaClient({
        cached,
        cachedSchemaVersion: '20260811200000',
        create,
        expectedSchemaVersion: '20260811200000',
      }),
    ).toBe(cached)
    expect(create).not.toHaveBeenCalled()
    expect(cached.$disconnect).not.toHaveBeenCalled()
  })

  it.each([
    ['an old schema signature', client(), 'older'],
    ['missing generated delegates', client({current: false}), '20260811200000'],
  ])('replaces %s without surfacing a request-time TypeError', (_, cached, version) => {
    const replacement = client()
    const create = vi.fn(() => replacement)

    expect(
      selectPrismaClient({
        cached,
        cachedSchemaVersion: version,
        create,
        expectedSchemaVersion: '20260811200000',
      }),
    ).toBe(replacement)
    expect(cached.$disconnect).toHaveBeenCalledTimes(1)
  })
})
