import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createPublicManagedRoute} from './public-managed-route'

const getPage = vi.hoisted(() => vi.fn())
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NOT_FOUND')
  }),
)

vi.mock('@/server/public-editorial', () => ({
  publicEditorialReader: {getPage},
}))
vi.mock('next/navigation', () => ({notFound}))
vi.mock('@/components/public-inquiry', () => ({
  PublicInquiryForm: ({type}: {type: string}) => <div>{type} form</div>,
}))

const managedPage = {
  body: 'A public page body long enough for the editorial contract.',
  eyebrow: 'Commission',
  id: '10000000-0000-4000-8000-000000000010',
  locale: 'tr',
  mediaPlacements: [],
  publishedAt: '2026-08-11T00:00:00.000Z',
  seo: {
    canonicalPath: '/tr/commission-a-work',
    description: 'A description long enough for the managed editorial page.',
    noIndex: false,
    title: 'Özel eser',
  },
  slug: 'commission',
  title: 'Özel eser',
}

describe('createPublicManagedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the exact locale and Studio slug and composes its inquiry', async () => {
    getPage.mockResolvedValueOnce(managedPage)
    const route = createPublicManagedRoute({
      inquiryType: 'COMMISSION',
      kind: 'commission',
      slug: 'commission',
    })

    render(await route.Page({params: Promise.resolve({locale: 'tr'})}))

    expect(getPage).toHaveBeenCalledWith('tr', 'commission')
    expect(screen.getByRole('heading', {name: 'Özel eser'})).toBeVisible()
    expect(
      screen.getByRole('heading', {name: 'Özel eser süreci'}),
    ).toBeVisible()
    expect(screen.getByText('COMMISSION form')).toBeVisible()
  })

  it('selects a page-specific collectors composition', async () => {
    getPage.mockResolvedValueOnce({...managedPage, slug: 'collectors'})
    const route = createPublicManagedRoute({
      inquiryType: 'GENERAL',
      kind: 'collectors',
      slug: 'collectors',
    })

    render(await route.Page({params: Promise.resolve({locale: 'tr'})}))

    expect(
      screen.getByRole('region', {name: 'Koleksiyon oluşturma yolları'}),
    ).toBeVisible()
    expect(screen.getByText('GENERAL form')).toBeVisible()
  })

  it.each([
    ['artist', 'Pratiği keşfet'],
    ['studio', 'Yaratıcı süreç'],
    ['private-viewings', 'Daha yakından bir karşılaşma'],
  ] as const)(
    'renders the %s composition selected by the route',
    async (kind, landmark) => {
      getPage.mockResolvedValueOnce(managedPage)
      const route = createPublicManagedRoute({
        inquiryType:
          kind === 'private-viewings' ? 'PRIVATE_VIEWING' : undefined,
        kind,
        slug: kind,
      })

      render(await route.Page({params: Promise.resolve({locale: 'tr'})}))

      expect(screen.getByRole('heading', {name: landmark})).toBeVisible()
      if (kind === 'private-viewings') {
        expect(screen.getByText('PRIVATE_VIEWING form')).toBeVisible()
      }
    },
  )

  it('uses managed SEO and fails closed when content or locale is unavailable', async () => {
    const route = createPublicManagedRoute({kind: 'artist', slug: 'artist'})

    getPage.mockResolvedValueOnce(managedPage)

    await expect(
      route.generateMetadata({params: Promise.resolve({locale: 'tr'})}),
    ).resolves.toMatchObject({
      alternates: {canonical: '/tr/commission-a-work'},
      description: managedPage.seo.description,
      robots: {follow: true, index: true},
      title: managedPage.seo.title,
    })

    getPage.mockResolvedValueOnce(null)
    await expect(
      route.Page({params: Promise.resolve({locale: 'tr'})}),
    ).rejects.toThrow('NOT_FOUND')
  })

  it('normalizes stored prefixed English canonical paths', async () => {
    const route = createPublicManagedRoute({kind: 'artist', slug: 'artist'})

    getPage.mockResolvedValueOnce({
      ...managedPage,
      locale: 'en',
      seo: {...managedPage.seo, canonicalPath: '/en/artist'},
    })

    await expect(
      route.generateMetadata({params: Promise.resolve({locale: 'en'})}),
    ).resolves.toMatchObject({alternates: {canonical: '/artist'}})
  })

  it('renders a marked English fallback for an active dynamic locale without indexing it as translated content', async () => {
    const route = createPublicManagedRoute({kind: 'artist', slug: 'artist'})
    const englishPage = {
      ...managedPage,
      locale: 'en',
      seo: {...managedPage.seo, canonicalPath: '/artist'},
    }

    getPage.mockResolvedValueOnce(englishPage).mockResolvedValueOnce(englishPage)

    const {container} = render(
      await route.Page({params: Promise.resolve({locale: 'de'})}),
    )

    expect(getPage).toHaveBeenNthCalledWith(1, 'en', 'artist')
    expect(container.firstElementChild).toHaveAttribute('lang', 'en')
    await expect(
      route.generateMetadata({params: Promise.resolve({locale: 'de'})}),
    ).resolves.toMatchObject({
      alternates: {canonical: '/artist'},
      robots: {follow: true, index: false},
    })
  })
})
