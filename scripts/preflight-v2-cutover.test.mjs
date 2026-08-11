import {describe, expect, it} from 'vitest'

import {
  assertV2CutoverSafe,
  expectedLegacyContentTargets,
} from './preflight-v2-cutover.mjs'

describe('V2 production cutover preflight', () => {
  it('allows a new database and a database whose destructive cutover already completed', () => {
    expect(() =>
      assertV2CutoverSafe({
        contentRemovalApplied: false,
        legacyContentRows: 0,
        legacyStorageRows: 0,
        missingLegacyContentTargets: 0,
        storageRemovalApplied: false,
        unmappedLegacyStorageRows: 0,
      }),
    ).not.toThrow()

    expect(() =>
      assertV2CutoverSafe({
        contentRemovalApplied: true,
        legacyContentRows: 0,
        legacyStorageRows: 0,
        missingLegacyContentTargets: 0,
        storageRemovalApplied: true,
        unmappedLegacyStorageRows: 0,
      }),
    ).not.toThrow()
  })

  it('blocks destructive migrations while legacy media or content is unmapped', () => {
    expect(() =>
      assertV2CutoverSafe({
        contentRemovalApplied: false,
        legacyContentRows: 6,
        legacyStorageRows: 12,
        missingLegacyContentTargets: 2,
        storageRemovalApplied: false,
        unmappedLegacyStorageRows: 3,
      }),
    ).toThrow('V2_CUTOVER_UNMAPPED_LEGACY_MEDIA:3')

    expect(() =>
      assertV2CutoverSafe({
        contentRemovalApplied: false,
        legacyContentRows: 6,
        legacyStorageRows: 12,
        missingLegacyContentTargets: 2,
        storageRemovalApplied: false,
        unmappedLegacyStorageRows: 0,
      }),
    ).toThrow('V2_CUTOVER_UNMAPPED_LEGACY_CONTENT:2')
  })

  it('derives every locale-specific typed target and ignores only explicit placeholder store rows', () => {
    const targets = expectedLegacyContentTargets(
      [
        {data: {title: 'A memory'}, id: 'legacy-1', section_type: 'memories'},
        {
          data: {imageUrl: '/img/empty-event-image.png', title: 'Placeholder'},
          id: 'legacy-2',
          section_type: 'store',
        },
      ],
      ['en', 'tr'],
    )

    expect(targets).toEqual([
      {
        id: '39d607c8-02e5-5f67-b6a5-a3e6f7798545',
        table: 'memories',
      },
      {
        id: '1ff0bf24-6b66-5391-9dc9-50aca654b64b',
        table: 'memories',
      },
    ])
  })

  it('refuses unsupported legacy section types instead of silently dropping them', () => {
    expect(() =>
      expectedLegacyContentTargets(
        [{data: {}, id: 'legacy-3', section_type: 'unknown'}],
        ['en'],
      ),
    ).toThrow('V2_CUTOVER_UNSUPPORTED_LEGACY_SECTION:unknown')
  })
})
