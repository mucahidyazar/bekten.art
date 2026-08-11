import {describe, expect, it} from 'vitest'

import {
  STUDIO_EDITORIAL_CONFIGURATIONS,
  studioEditorialConfigurationForSegment,
  studioEditorialConfigurationForType,
} from './editorial-route-config'

describe('Studio editorial route configuration', () => {
  it('maps every kebab-case Studio segment in both directions', () => {
    expect(STUDIO_EDITORIAL_CONFIGURATIONS).toHaveLength(6)

    for (const configuration of STUDIO_EDITORIAL_CONFIGURATIONS) {
      expect(
        studioEditorialConfigurationForSegment(configuration.routeSegment),
      ).toBe(configuration)
      expect(
        studioEditorialConfigurationForType(configuration.entityType),
      ).toBe(configuration)
    }
  })

  it('fails closed for an unsupported route or entity type', () => {
    expect(studioEditorialConfigurationForSegment('store')).toBeNull()
    expect(() => studioEditorialConfigurationForType('STORE' as never)).toThrow(
      'STUDIO_EDITORIAL_CONFIG_INVALID',
    )
  })
})
