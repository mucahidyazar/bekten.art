// @vitest-environment jsdom

import {beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@/configs/env.mjs', () => ({
  env: {NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID: 'GTM-TEST123'},
}))

import {virtualPageview} from './gtag'

describe('virtualPageview', () => {
  beforeEach(() => {
    window.dataLayer = []
    window.history.replaceState(
      {},
      '',
      '/en/reset-password?token=super-secret-token',
    )
  })

  it('sends only the supplied pathname and a token-free location', () => {
    virtualPageview('/en/reset-password')

    expect(window.dataLayer).toEqual([
      expect.objectContaining({
        event: 'virtual_page_view',
        page_location: 'http://localhost:3000/en/reset-password',
        page_path: '/en/reset-password',
      }),
    ])
    expect(JSON.stringify(window.dataLayer)).not.toContain('super-secret-token')
  })
})
