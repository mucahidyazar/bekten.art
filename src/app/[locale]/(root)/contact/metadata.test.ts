import {describe, expect, it, vi} from 'vitest'

const prepareMetadata = vi.hoisted(() => vi.fn((metadata: unknown) => metadata))

vi.mock('@/utils/prepare-metadata', () => ({prepareMetadata}))

import {generateMetadata} from './page'

describe('contact metadata', () => {
  it('uses the prefixless English canonical path', async () => {
    await expect(
      generateMetadata({params: Promise.resolve({locale: 'en'})}),
    ).resolves.toMatchObject({
      alternates: {canonical: '/contact'},
    })
  })

  it('uses the URL locale for localized metadata', async () => {
    await expect(
      generateMetadata({params: Promise.resolve({locale: 'tr'})}),
    ).resolves.toMatchObject({
      alternates: {canonical: '/tr/contact'},
      contentLocale: 'tr',
      title: 'İletişim',
    })
  })
})
