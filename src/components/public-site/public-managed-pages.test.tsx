import {render, screen, within} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {
  PublicArtistPage,
  PublicCollectorsPage,
  PublicCommissionPage,
  PublicPrivateViewingsPage,
  PublicStudioPage,
} from './public-managed-pages'

import type {PublicPage} from '@/server/public-editorial'

const page = {
  body: [
    'Published opening paragraph from Bekten Studio.',
    'A second editable paragraph about the practice.',
    'A final editable paragraph from the archive.',
  ].join('\n\n'),
  eyebrow: 'Published eyebrow',
  id: '10000000-0000-4000-8000-000000000010',
  locale: 'en',
  mediaPlacements: [
    {
      altText: 'Published hero from Bekten Studio',
      caption: 'Published caption',
      credit: 'Published credit',
      crop: 'ORIGINAL',
      displayOrder: 0,
      focalPoint: null,
      height: 1200,
      mediaObjectId: '50000000-0000-4000-8000-000000000001',
      mimeType: 'image/png',
      role: 'HERO',
      url: '/api/media/50000000-0000-4000-8000-000000000001',
      width: 960,
    },
    {
      altText: 'Published process detail',
      caption: null,
      credit: null,
      crop: 'ORIGINAL',
      displayOrder: 1,
      focalPoint: null,
      height: 900,
      mediaObjectId: '50000000-0000-4000-8000-000000000002',
      mimeType: 'image/png',
      role: 'GALLERY',
      url: '/api/media/50000000-0000-4000-8000-000000000002',
      width: 1200,
    },
  ],
  publishedAt: '2026-08-11T00:00:00.000Z',
  seo: {
    canonicalPath: '/artist',
    description: 'A published description for the managed page.',
    noIndex: false,
    title: 'Published SEO title',
  },
  slug: 'artist',
  title: 'Published page title',
} as PublicPage

describe('reference-faithful managed public pages', () => {
  it('composes the Artist page as biography, statement and numbered practice notes', () => {
    render(<PublicArtistPage locale="en" page={page} />)

    expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1)
    expect(screen.getByRole('heading', {name: page.title})).toBeVisible()
    expect(
      screen.getByRole('heading', {name: 'Biography & statement'}),
    ).toBeVisible()
    expect(screen.getByRole('heading', {name: 'Practice notes'})).toBeVisible()
    expect(
      screen.getByRole('heading', {name: 'Explore the practice'}),
    ).toBeVisible()
    expect(screen.getByRole('link', {name: 'View works'})).toHaveAttribute(
      'href',
      '/works',
    )
    expect(screen.getByText(page.mediaPlacements[0].caption!)).toBeVisible()
    expect(screen.getByText(page.mediaPlacements[0].credit!)).toBeVisible()
    expect(screen.getByText(/final editable paragraph/iu)).toBeVisible()
  })

  it('composes the Studio page with a studio note, process and materials sections', () => {
    render(<PublicStudioPage locale="en" page={page} />)

    expect(screen.getByRole('heading', {name: page.title})).toBeVisible()
    expect(
      screen.getByRole('link', {name: 'Creative process'}),
    ).toHaveAttribute('href', '#creative-process')
    expect(
      screen.getByRole('heading', {name: 'Creative process'}),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', {name: 'Materials & technique'}),
    ).toBeVisible()
    expect(screen.getByText('Studio note')).toBeVisible()
    expect(
      screen.getByRole('img', {name: 'Published process detail'}),
    ).toBeVisible()
    expect(screen.getAllByText(/editable paragraph/iu)).toHaveLength(2)
  })

  it('uses the reference-matched panoramic Studio asset when no managed hero exists', () => {
    const {container} = render(
      <PublicStudioPage locale="en" page={{...page, mediaPlacements: []}} />,
    )

    const decorativeHero = container.querySelector(
      'header img[aria-hidden="true"]',
    )

    expect(decorativeHero).toHaveAttribute(
      'src',
      expect.stringContaining('heritage-studio-hero.jpg'),
    )
  })

  it('composes the Collectors page around three real service paths and its inquiry', () => {
    render(
      <PublicCollectorsPage
        inquiry={<section aria-label="Collector inquiry">Inquiry</section>}
        locale="en"
        page={page}
      />,
    )

    const services = screen.getByRole('region', {name: 'Ways to collect'})

    expect(within(services).getAllByRole('article')).toHaveLength(3)
    expect(
      within(services).getByRole('link', {name: 'View available works'}),
    ).toHaveAttribute('href', '/available-works')
    expect(
      within(services).getByRole('link', {name: 'Arrange a private viewing'}),
    ).toHaveAttribute('href', '/private-viewings')
    expect(
      within(services).getByRole('link', {name: 'Discuss a commission'}),
    ).toHaveAttribute('href', '/commission-a-work')
    expect(
      screen.getByRole('region', {name: 'Collector inquiry'}),
    ).toBeVisible()
    expect(screen.queryByText(/price|buy|cart|checkout/iu)).toBeNull()
  })

  it('composes the Turkish Commission page with a five-step process, FAQ and form', () => {
    render(
      <PublicCommissionPage
        inquiry={<section aria-label="Commission inquiry">Inquiry</section>}
        locale="tr"
        page={{...page, locale: 'tr'}}
      />,
    )

    expect(
      screen.getByRole('heading', {name: 'Özel eser süreci'}),
    ).toBeVisible()
    expect(
      screen.getByRole('list', {name: 'Özel eser süreci'}),
    ).toHaveTextContent('01')
    expect(
      screen.getByRole('list', {name: 'Özel eser süreci'}).children,
    ).toHaveLength(5)
    expect(
      screen.getByRole('heading', {name: 'Sık sorulan sorular'}),
    ).toBeVisible()
    expect(screen.getAllByRole('group')).toHaveLength(3)
    expect(
      screen.getByRole('region', {name: 'Commission inquiry'}),
    ).toBeVisible()
  })

  it('composes Private Viewings with benefits, expectations and the real inquiry slot', () => {
    render(
      <PublicPrivateViewingsPage
        inquiry={
          <section aria-label="Private viewing inquiry">Inquiry</section>
        }
        locale="en"
        page={page}
      />,
    )

    expect(
      screen.getByRole('region', {name: 'A closer encounter'}),
    ).toBeVisible()
    expect(screen.getByRole('heading', {name: 'What to expect'})).toBeVisible()
    expect(
      screen.getByRole('heading', {name: 'Request a private viewing'}),
    ).toBeVisible()
    expect(
      screen.getByRole('region', {name: 'Private viewing inquiry'}),
    ).toBeVisible()
    expect(
      screen.queryByText(/monday|saturday|hours|shipping|certificate/iu),
    ).toBeNull()
  })

  it('falls back to decorative project imagery without inventing published media', () => {
    const {container} = render(
      <PublicArtistPage
        locale="en"
        page={{
          ...page,
          body: 'Only the published introduction.',
          eyebrow: null,
          mediaPlacements: [],
        }}
      />,
    )

    expect(screen.getByRole('heading', {name: page.title})).toBeVisible()
    expect(screen.queryByRole('img')).toBeNull()
    expect(
      screen.queryByRole('heading', {name: 'Biography & statement'}),
    ).toBeNull()
    expect(screen.queryByRole('heading', {name: 'Practice notes'})).toBeNull()
    expect(container.querySelector('figure')).not.toHaveClass('undefined')
  })

  it('does not invent empty Studio-note or materials sections for short CMS copy', () => {
    render(
      <PublicStudioPage
        locale="en"
        page={{...page, body: 'Only the published introduction.'}}
      />,
    )

    expect(screen.queryByText('Studio note')).toBeNull()
    expect(
      screen.queryByRole('heading', {name: 'Materials & technique'}),
    ).toBeNull()
  })
})
