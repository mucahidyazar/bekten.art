import {describe, expect, it} from 'vitest'

import {
  assertLocalEditorialRefreshAllowed,
  createLocalEditorialRefreshPlan,
} from './refresh-local-editorial-content.mjs'

const content = [
  {
    delegate: 'artwork',
    entityId: '10000000-0000-4000-8000-000000000001',
    entityType: 'ARTWORK',
    identity: 'ARTWORK:en:winter-light',
    placements: [],
    revision: {
      locale: 'en',
      snapshot: {mediaPlacements: [], title: 'Winter Light'},
    },
    row: {
      createdAt: new Date('2026-08-11T00:00:00.000Z'),
      id: '10000000-0000-4000-8000-000000000001',
      locale: 'en',
      slug: 'winter-light',
      title: 'Winter Light',
      translationGroupId: '90000000-0000-4000-8000-000000000001',
      updatedAt: new Date('2026-08-11T00:00:00.000Z'),
      version: 1,
    },
  },
  {
    delegate: 'artwork',
    entityId: '10000000-0000-4000-8000-000000000002',
    entityType: 'ARTWORK',
    identity: 'ARTWORK:tr:kis-isigi',
    placements: [],
    revision: {
      locale: 'tr',
      snapshot: {mediaPlacements: [], title: 'Kış Işığı'},
    },
    row: {
      createdAt: new Date('2026-08-11T00:00:00.000Z'),
      id: '10000000-0000-4000-8000-000000000002',
      locale: 'tr',
      slug: 'kis-isigi',
      title: 'Kış Işığı',
      translationGroupId: '90000000-0000-4000-8000-000000000001',
      updatedAt: new Date('2026-08-11T00:00:00.000Z'),
      version: 1,
    },
  },
  {
    delegate: 'page',
    entityId: '10000000-0000-4000-8000-000000000003',
    entityType: 'PAGE',
    identity: 'PAGE:en:about',
    placements: [
      {
        altText: 'The artist',
        mediaObjectId: '20000000-0000-4000-8000-000000000099',
        role: 'HERO',
      },
    ],
    revision: {
      locale: 'en',
      snapshot: {
        mediaPlacements: [
          {
            altText: 'The artist',
            mediaObjectId: '20000000-0000-4000-8000-000000000099',
            role: 'HERO',
          },
        ],
        title: 'The artist',
      },
    },
    row: {
      createdAt: new Date('2026-08-11T00:00:00.000Z'),
      id: '10000000-0000-4000-8000-000000000003',
      locale: 'en',
      slug: 'about',
      title: 'The artist',
      translationGroupId: '90000000-0000-4000-8000-000000000002',
      updatedAt: new Date('2026-08-11T00:00:00.000Z'),
      version: 1,
    },
  },
]

const instagramMedia = [
  {
    altText: 'A Bekten Usubaliev painting',
    caption: 'Bekten Usubaliev · Instagram archive',
    id: '20000000-0000-4000-8000-000000000001',
  },
  {
    altText: 'A second Bekten Usubaliev painting',
    caption: 'Bekten Usubaliev · Instagram archive',
    id: '20000000-0000-4000-8000-000000000002',
  },
]

describe('local editorial content refresh', () => {
  it('requires an explicit development-only opt in', () => {
    expect(() =>
      assertLocalEditorialRefreshAllowed({
        ALLOW_LOCAL_EDITORIAL_REFRESH: 'bekten-art-local-refresh',
        DATABASE_URL: 'postgresql://user:secret@127.0.0.1:5432/bekten_art',
        NODE_ENV: 'production',
      }),
    ).toThrowError('LOCAL_EDITORIAL_REFRESH_FORBIDDEN')
    expect(() =>
      assertLocalEditorialRefreshAllowed({NODE_ENV: 'development'}),
    ).toThrowError('LOCAL_EDITORIAL_REFRESH_FORBIDDEN')
    expect(() =>
      assertLocalEditorialRefreshAllowed({
        ALLOW_LOCAL_EDITORIAL_REFRESH: 'bekten-art-local-refresh',
        DATABASE_URL: 'postgresql://user:secret@127.0.0.1:5432/bekten_art',
        NODE_ENV: 'development',
      }),
    ).not.toThrow()
    expect(() =>
      assertLocalEditorialRefreshAllowed({
        ALLOW_LOCAL_EDITORIAL_REFRESH: 'bekten-art-local-refresh',
        DATABASE_URL:
          'postgresql://user:secret@database.example.com/bekten_art',
        NODE_ENV: 'development',
      }),
    ).toThrowError('LOCAL_EDITORIAL_REFRESH_FORBIDDEN')
  })

  it('uses one real Instagram work per translation group and preserves exempt imagery', () => {
    const plan = createLocalEditorialRefreshPlan({content, instagramMedia})
    const englishWork = plan.find(item => item.row.locale === 'en')
    const turkishWork = plan.find(item => item.row.locale === 'tr')
    const about = plan.find(item => item.row.slug === 'about')

    expect(englishWork?.placements).toHaveLength(1)
    expect(turkishWork?.placements[0]?.mediaObjectId).toBe(
      englishWork?.placements[0]?.mediaObjectId,
    )
    expect(englishWork?.revision.version).toBe(2)
    expect(englishWork?.row.version).toBe(2)
    expect(englishWork?.update).not.toHaveProperty('id')
    expect(englishWork?.update).not.toHaveProperty('createdAt')
    expect(englishWork?.update).not.toHaveProperty('updatedAt')
    expect(about?.placements[0]?.mediaObjectId).toBe(
      '20000000-0000-4000-8000-000000000099',
    )
  })

  it('fails closed when real media are unavailable', () => {
    expect(() =>
      createLocalEditorialRefreshPlan({content, instagramMedia: []}),
    ).toThrowError('LOCAL_EDITORIAL_MEDIA_UNAVAILABLE')
  })
})
