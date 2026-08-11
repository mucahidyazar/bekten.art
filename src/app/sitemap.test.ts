import {beforeEach, describe, expect, it, vi} from 'vitest'

const database = vi.hoisted(() => ({
  artwork: {findMany: vi.fn()},
  collection: {findMany: vi.fn()},
  contentRevision: {findMany: vi.fn()},
  exhibition: {findMany: vi.fn()},
  journalEntry: {findMany: vi.fn()},
  pressItem: {findMany: vi.fn()},
}))

vi.mock('@/lib/db', () => ({prisma: database}))

const publishedAt = new Date('2026-08-08T10:00:00.000Z')
const updatedAt = new Date('2026-08-09T10:00:00.000Z')
const revisionAt = new Date('2026-08-10T10:00:00.000Z')

const entities = [
  {
    delegate: database.artwork,
    entityId: '10000000-0000-4000-8000-000000000001',
    entityType: 'ARTWORK',
    locale: 'en',
    publicPath: '/works/silent-steppe',
    slug: 'silent-steppe',
  },
  {
    delegate: database.collection,
    entityId: '20000000-0000-4000-8000-000000000001',
    entityType: 'COLLECTION',
    locale: 'tr',
    publicPath: '/collections/bozkir-hafizasi',
    slug: 'bozkir-hafizasi',
  },
  {
    delegate: database.exhibition,
    entityId: '30000000-0000-4000-8000-000000000001',
    entityType: 'EXHIBITION',
    locale: 'ru',
    publicPath: '/exhibitions/tikhiy-svet',
    slug: 'tikhiy-svet',
  },
  {
    delegate: database.journalEntry,
    entityId: '40000000-0000-4000-8000-000000000001',
    entityType: 'JOURNAL_ENTRY',
    locale: 'ky',
    publicPath: '/journal/ustakanadan-kat',
    slug: 'ustakanadan-kat',
  },
  {
    delegate: database.pressItem,
    entityId: '50000000-0000-4000-8000-000000000001',
    entityType: 'PRESS_ENTRY',
    locale: 'en',
    publicPath: '/press/studio-visit',
    slug: 'studio-visit',
  },
] as const

describe('V2 sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    for (const entity of entities) {
      entity.delegate.findMany.mockResolvedValue([
        {
          id: entity.entityId,
          locale: entity.locale,
          publishedAt,
          updatedAt,
          version: 2,
        },
      ])
    }

    database.contentRevision.findMany.mockResolvedValue(
      entities.map(entity => ({
        createdAt: revisionAt,
        entityId: entity.entityId,
        entityType: entity.entityType,
        locale: entity.locale,
        snapshot: {
          locale: entity.locale,
          seo: {noIndex: false},
          slug: entity.slug,
        },
        version: 2,
      })),
    )
  })

  it('contains every canonical static V2 and legal path in all four locales', async () => {
    const {default: sitemap} = await import('./sitemap')
    const entries = await sitemap()
    const urls = new Set(entries.map(entry => entry.url))
    const staticPaths = [
      '/',
      '/works',
      '/available-works',
      '/collections',
      '/exhibitions',
      '/journal',
      '/press',
      '/artist',
      '/studio',
      '/collectors',
      '/commission-a-work',
      '/private-viewings',
      '/contact',
      '/archive',
      '/privacy-policy',
      '/terms-of-service',
    ]

    for (const locale of ['en', 'tr', 'ru', 'ky']) {
      for (const path of staticPaths) {
        const suffix = path === '/' ? '' : path

        expect(urls).toContain(`https://bekten.art/${locale}${suffix}`)
      }
    }

    expect([...urls].some(url => /\/(?:gallery|news|about)(?:\/|$)/u.test(url))).toBe(
      false,
    )
    expect([...urls].some(url => url.includes('/kg'))).toBe(false)

    const works = entries.find(
      entry => entry.url === 'https://bekten.art/en/works',
    )

    expect(works?.alternates?.languages).toEqual({
      en: 'https://bekten.art/en/works',
      tr: 'https://bekten.art/tr/works',
      ru: 'https://bekten.art/ru/works',
      ky: 'https://bekten.art/ky/works',
      'x-default': 'https://bekten.art/en/works',
    })
  })

  it('indexes only published entities backed by a matching immutable snapshot', async () => {
    const missingRevisionId = '10000000-0000-4000-8000-000000000002'
    const futureRevisionId = '10000000-0000-4000-8000-000000000003'
    const noIndexId = '10000000-0000-4000-8000-000000000004'

    database.artwork.findMany.mockResolvedValue([
      {
        id: entities[0].entityId,
        locale: 'en',
        publishedAt,
        updatedAt,
        version: 2,
      },
      {
        id: missingRevisionId,
        locale: 'en',
        publishedAt,
        updatedAt,
        version: 1,
      },
      {
        id: futureRevisionId,
        locale: 'en',
        publishedAt,
        updatedAt,
        version: 1,
      },
      {
        id: noIndexId,
        locale: 'en',
        publishedAt,
        updatedAt,
        version: 1,
      },
    ])
    database.contentRevision.findMany.mockResolvedValue([
      ...entities.map(entity => ({
        createdAt: revisionAt,
        entityId: entity.entityId,
        entityType: entity.entityType,
        locale: entity.locale,
        snapshot: {
          locale: entity.locale,
          seo: {noIndex: false},
          slug: entity.slug,
        },
        version: 2,
      })),
      {
        createdAt: revisionAt,
        entityId: futureRevisionId,
        entityType: 'ARTWORK',
        locale: 'en',
        snapshot: {locale: 'en', slug: 'unpublished-future-snapshot'},
        version: 2,
      },
      {
        createdAt: revisionAt,
        entityId: entities[0].entityId,
        entityType: 'ARTWORK',
        locale: 'tr',
        snapshot: {locale: 'tr', slug: 'wrong-locale'},
        version: 2,
      },
      {
        createdAt: revisionAt,
        entityId: entities[0].entityId,
        entityType: 'ARTWORK',
        locale: 'en',
        snapshot: {locale: 'en', slug: '../unsafe'},
        version: 2,
      },
      {
        createdAt: revisionAt,
        entityId: noIndexId,
        entityType: 'ARTWORK',
        locale: 'en',
        snapshot: {
          locale: 'en',
          seo: {noIndex: true},
          slug: 'private-study',
        },
        version: 1,
      },
    ])

    const {default: sitemap} = await import('./sitemap')
    const entries = await sitemap()
    const dynamicEntries = entities.map(entity =>
      entries.find(
        entry =>
          entry.url ===
          `https://bekten.art/${entity.locale}${entity.publicPath}`,
      ),
    )

    expect(dynamicEntries.every(Boolean)).toBe(true)
    expect(dynamicEntries[0]?.lastModified).toEqual(revisionAt)
    expect(entries.some(entry => entry.url.includes('missing'))).toBe(false)
    expect(entries.some(entry => entry.url.includes('future'))).toBe(false)
    expect(entries.some(entry => entry.url.includes('wrong-locale'))).toBe(false)
    expect(entries.some(entry => entry.url.includes('unsafe'))).toBe(false)
    expect(entries.some(entry => entry.url.includes('private-study'))).toBe(false)

    for (const entity of entities) {
      expect(entity.delegate.findMany).toHaveBeenCalledWith({
        orderBy: [{updatedAt: 'desc'}, {id: 'asc'}],
        select: {
          id: true,
          locale: true,
          publishedAt: true,
          updatedAt: true,
          version: true,
        },
        where: {publishedAt: {not: null}, status: 'PUBLISHED'},
      })
    }
  })

  it('fails closed to static URLs without logging database error details', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    database.artwork.findMany.mockRejectedValue(
      new Error('postgres://admin:secret@production/database'),
    )

    const {default: sitemap} = await import('./sitemap')
    const entries = await sitemap()

    expect(entries).toHaveLength(16 * 4)
    expect(entries.every(entry => !/\/(?:works|collections|exhibitions|journal|press)\/.+/u.test(entry.url))).toBe(
      true,
    )
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
