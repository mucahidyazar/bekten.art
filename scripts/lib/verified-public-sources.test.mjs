import {describe, expect, it} from 'vitest'

import {
  assertVerifiedPublicSourceSeedAllowed,
  createVerifiedPublicSourcePlan,
  verifiedPublicSources,
} from './verified-public-sources.mjs'

const media = verifiedPublicSources.map((_, index) => ({
  id: `11111111-1111-4111-8111-11111111111${index}`,
  status: 'READY',
  visibility: 'PUBLIC',
}))

describe('verified public-source seed', () => {
  it('contains only HTTPS sources and source-supported records', () => {
    expect(verifiedPublicSources).toHaveLength(4)

    for (const source of verifiedPublicSources) {
      expect(source.sourceUrl).toMatch(/^https:\/\//u)
      expect(source.body.length).toBeGreaterThan(80)
      expect(source.startsAt).toBeInstanceOf(Date)
    }
  })

  it('creates stable editable exhibition and press plans with Garage media', () => {
    const first = createVerifiedPublicSourcePlan(media)
    const second = createVerifiedPublicSourcePlan(media)

    expect(second).toEqual(first)
    expect(first).toHaveLength(4)
    expect(first[0].exhibition.row.status).toBe('PUBLISHED')
    expect(first[0].press.row.sourceUrl).toBe(
      verifiedPublicSources[0].sourceUrl,
    )
    expect(first[0].exhibition.placement.mediaObjectId).toBe(media[0].id)
  })

  it('fails closed without explicit local seed confirmation', () => {
    expect(() => assertVerifiedPublicSourceSeedAllowed({})).toThrow(
      'VERIFIED_PUBLIC_SOURCE_SEED_NOT_AUTHORIZED',
    )
  })
})
