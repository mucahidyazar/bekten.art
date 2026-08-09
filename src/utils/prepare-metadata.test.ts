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
})
