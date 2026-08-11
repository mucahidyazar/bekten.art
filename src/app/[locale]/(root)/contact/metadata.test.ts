import {describe, expect, it, vi} from 'vitest'

const prepareMetadata = vi.hoisted(() => vi.fn((metadata: unknown) => metadata))

vi.mock('next-intl/server', () => ({getLocale: async () => 'en'}))
vi.mock('@/utils/prepare-metadata', () => ({prepareMetadata}))

import {generateMetadata} from './page'

describe('contact metadata', () => {
  it('uses the prefixless English canonical path', async () => {
    await expect(generateMetadata()).resolves.toMatchObject({
      alternates: {canonical: '/contact'},
    })
  })
})
