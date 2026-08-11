import {renderToStaticMarkup} from 'react-dom/server'
import {describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND')
  }),
  resolve: vi.fn(),
}))

vi.mock('next/navigation', () => ({notFound: mocks.notFound}))
vi.mock('@/server/site-locales/public-site-locales', () => ({
  publicSiteLocaleRegistry: {list: mocks.list, resolve: mocks.resolve},
}))
vi.mock('@/components/public-site/public-header', () => ({
  PublicHeader: (properties: Readonly<{locale: string; locales: unknown}>) => (
    <div data-locale={properties.locale} data-locales={JSON.stringify(properties.locales)} />
  ),
}))
vi.mock('@/components/public-site/public-footer', () => ({
  PublicFooter: () => <footer />,
}))
vi.mock('@/components/seo/breadcrumb', () => ({
  Breadcrumb: () => null,
}))

import RootLayout from './layout'

const locales = Object.freeze([
  {code: 'en', nativeName: 'English'},
  {code: 'de', nativeName: 'Deutsch'},
])

describe('public locale layout', () => {
  it('passes registered active locales to the public shell', async () => {
    mocks.resolve.mockResolvedValue({...locales[1], status: 'ACTIVE'})
    mocks.list.mockResolvedValue(locales)

    const markup = renderToStaticMarkup(
      await RootLayout({
        children: <p>Public content</p>,
        params: Promise.resolve({locale: 'de'}),
      }),
    )

    expect(markup).toContain('data-locale="de"')
    expect(markup).toContain('Deutsch')
  })

  it('rejects locales that are not active in the public registry', async () => {
    mocks.resolve.mockResolvedValue(null)

    await expect(
      RootLayout({children: null, params: Promise.resolve({locale: 'de'})}),
    ).rejects.toThrow('NOT_FOUND')
  })
})
