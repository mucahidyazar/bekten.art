import {describe, expect, it} from 'vitest'

import robots from './robots'

describe('robots metadata', () => {
  it('keeps public locale routes crawlable and private surfaces out of the index', () => {
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
    const generalRule = rules.find(rule => rule.userAgent === '*')

    expect(generalRule?.allow).toEqual(expect.arrayContaining(['/', '/api/og']))
    expect(generalRule?.disallow).toEqual(
      expect.arrayContaining(['/api/', '/admin/', '/*/admin/', '/auth/']),
    )
    expect(result.sitemap).toBe('https://bekten.art/sitemap.xml')
    expect(result.host).toBe('https://bekten.art')
  })
})
