import {describe, expect, it, vi} from 'vitest'

const permanentRedirect = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({permanentRedirect}))
vi.mock('@/services', () => ({
  getPublishedNewsArticles: vi.fn(async () => []),
}))

import NewsPage from './page'

describe('legacy news route', () => {
  it('permanently redirects to the locale-preserving V2 journal route', async () => {
    await NewsPage({params: Promise.resolve({locale: 'ru'})})

    expect(permanentRedirect).toHaveBeenCalledWith('/ru/journal')
  })
})
