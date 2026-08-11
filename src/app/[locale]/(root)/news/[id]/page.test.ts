import {describe, expect, it, vi} from 'vitest'

const navigation = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('LEGACY_ROUTE_NOT_REDIRECTED')
  }),
  permanentRedirect: vi.fn(),
}))

vi.mock('next/navigation', () => navigation)
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}))
vi.mock('@/services', () => ({
  getPublishedNewsArticle: vi.fn(async () => null),
  getPublishedNewsArticles: vi.fn(async () => []),
}))

import NewsDetailPage from './page'

describe('legacy news detail route', () => {
  it('permanently redirects the encoded slug to the locale-preserving journal detail', async () => {
    await NewsDetailPage({
      params: Promise.resolve({id: 'studio visit', locale: 'en'}),
    })

    expect(navigation.permanentRedirect).toHaveBeenCalledWith(
      '/journal/studio%20visit',
    )
    expect(navigation.notFound).not.toHaveBeenCalled()
  })
})
