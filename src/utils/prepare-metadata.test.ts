import {describe, expect, it} from 'vitest'

import {prepareMetadata} from './prepare-metadata'

describe('prepareMetadata', () => {
  it('does not emit a global root canonical that conflicts with localized pages', () => {
    const metadata = prepareMetadata({
      title: 'Gallery',
      description: 'Selected works',
      page: 'gallery',
    })

    expect(metadata.alternates).toBeUndefined()
    expect(metadata.metadataBase).toEqual(new URL('https://bekten.art'))
  })

  it('keeps caller-provided social metadata while retaining safe defaults', () => {
    const metadata = prepareMetadata({
      openGraph: {title: 'Custom social title'},
      twitter: {creator: '@custom'},
    })

    expect(metadata.openGraph).toEqual(
      expect.objectContaining({title: 'Custom social title', type: 'website'}),
    )
    expect(metadata.twitter).toEqual(
      expect.objectContaining({
        creator: '@custom',
        card: 'summary_large_image',
      }),
    )
  })

  it('uses the content locale for Open Graph without leaking custom options', () => {
    const metadata = prepareMetadata({
      contentLocale: 'tr',
      title: 'Eserler',
    })

    expect(metadata.openGraph).toEqual(
      expect.objectContaining({
        alternateLocale: ['en_US', 'ru_RU', 'ky_KG'],
        locale: 'tr_TR',
      }),
    )
    expect(metadata).not.toHaveProperty('contentLocale')
  })

  it('uses a neutral editorial identity instead of unverified legacy claims', () => {
    const metadata = prepareMetadata({contentLocale: 'en'})

    expect(metadata.description).toBe(
      'The official editorial archive for Bekten Usubaliev’s works, exhibitions, journal and studio.',
    )
    expect(metadata.openGraph).toEqual(
      expect.objectContaining({siteName: 'Bekten — Artist & Studio'}),
    )
    expect(JSON.stringify(metadata)).not.toMatch(
      /master painter|gallery and workshop|artist portfolio/iu,
    )
  })
})
