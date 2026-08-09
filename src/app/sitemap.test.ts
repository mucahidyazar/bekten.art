import {beforeEach, describe, expect, it, vi} from 'vitest'

const findMany = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    newsArticle: {findMany},
  },
}))

describe('sitemap', () => {
  beforeEach(() => {
    findMany.mockReset()
    findMany.mockResolvedValue([
      {
        locale: 'en',
        slug: 'news-1',
        updatedAt: new Date('2026-08-08T10:00:00.000Z'),
      },
      {
        locale: 'ky',
        slug: 'news-1',
        updatedAt: new Date('2026-08-08T10:00:00.000Z'),
      },
    ])
  })

  it('contains only indexable localized pages with complete alternates', async () => {
    const {default: sitemap} = await import('./sitemap')
    const entries = await sitemap()
    const urls = entries.map(entry => entry.url)

    expect(urls).toContain('https://bekten.art/ky/gallery')
    expect(urls).toContain('https://bekten.art/ky/news/news-1')
    expect(urls.some(url => url.includes('/kg'))).toBe(false)
    expect(
      urls.some(url => /\/(?:api|auth|sign-in|sign-up)(?:\/|$)/.test(url)),
    ).toBe(false)

    const about = entries.find(
      entry => entry.url === 'https://bekten.art/tr/about',
    )

    expect(about?.alternates?.languages).toEqual({
      en: 'https://bekten.art/en/about',
      tr: 'https://bekten.art/tr/about',
      ru: 'https://bekten.art/ru/about',
      ky: 'https://bekten.art/ky/about',
      'x-default': 'https://bekten.art/en/about',
    })
    expect(about).not.toHaveProperty('lastModified')
  })

  it('uses the persisted content timestamp for dynamic pages', async () => {
    const {default: sitemap} = await import('./sitemap')
    const entries = await sitemap()
    const news = entries.find(
      entry => entry.url === 'https://bekten.art/en/news/news-1',
    )

    expect(news?.lastModified).toEqual(new Date('2026-08-08T10:00:00.000Z'))
    expect(findMany).toHaveBeenCalledWith({
      orderBy: {updatedAt: 'desc'},
      select: {locale: true, slug: true, updatedAt: true},
      where: {status: 'PUBLISHED'},
    })
  })
})
