// @vitest-environment jsdom

import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import ContactPage from './contact/page'
import RootLayout from './layout'

const getPublicContactInfo = vi.hoisted(() => vi.fn())

vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getTranslations: async () => (key: string) => key,
}))
vi.mock('@/utils/prepare-metadata', () => ({prepareMetadata: vi.fn()}))
vi.mock('@/server/contact/public-contact', () => ({
  getPublicContactInfo,
}))
vi.mock('@/components/footer', () => ({Footer: () => <footer>Footer</footer>}))
vi.mock('@/components/organisms/header', () => ({
  Header: () => <header>Header</header>,
}))
vi.mock('@/components/public-site/public-footer', () => ({
  PublicFooter: () => <footer data-testid="v2-footer">V2 footer</footer>,
}))
vi.mock('@/components/public-site/public-header', () => ({
  PublicHeader: () => <header data-testid="v2-header">V2 header</header>,
}))
vi.mock('@/components/seo/breadcrumb', () => ({
  Breadcrumb: ({showNavigation = true}: {showNavigation?: boolean}) =>
    showNavigation ? <nav aria-label="Breadcrumb">Breadcrumb</nav> : null,
}))
vi.mock('@/components/ui/progress-bar', () => ({default: () => null}))
vi.mock('@/components/molecules/call-to-action', () => ({
  CallToAction: () => <section>Call to action</section>,
}))
vi.mock('@/components/consent/google-map', () => ({
  ConsentGoogleMap: ({title}: {title: string}) => <iframe title={title} />,
}))

describe('public page landmarks', () => {
  it('provides a skip link targeting the focusable main content', async () => {
    render(await RootLayout({children: <p>Page content</p>}))

    expect(
      screen.getByRole('link', {name: /skip to main content/i}),
    ).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
    expect(screen.getByTestId('v2-header')).toBeVisible()
    expect(screen.getByTestId('v2-footer')).toBeVisible()
    expect(screen.queryByRole('navigation', {name: 'Breadcrumb'})).toBeNull()
  })

  it('keeps one page heading and names the contact map frame', async () => {
    getPublicContactInfo.mockResolvedValueOnce({
      address: 'Bishkek',
      email: 'studio@example.test',
      mapEmbedUrl: 'https://maps.example.test/embed',
      name: 'Bekten',
      phone: '+996 555 000 000',
      socials: [],
      workingHours: '',
    })
    render(await ContactPage())

    expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1)
    expect(screen.getByRole('heading', {name: 'Contact'})).toBeVisible()
    expect(screen.getByRole('img', {name: 'Bekten Usubaliev'})).toBeVisible()
    expect(screen.getByRole('heading', {name: 'Inquiry type'})).toBeVisible()
    expect(
      screen.getByRole('link', {name: 'Availability inquiry'}),
    ).toHaveAttribute('href', '/available-works')
    expect(screen.getByRole('link', {name: 'Commission'})).toHaveAttribute(
      'href',
      '/commission-a-work',
    )
    expect(screen.getByRole('link', {name: 'Private viewing'})).toHaveAttribute(
      'href',
      '/private-viewings',
    )
    expect(
      screen.getByRole('link', {name: 'studio@example.test'}),
    ).toHaveAttribute('href', 'mailto:studio@example.test')
    expect(screen.getByTitle(/studio map/i)).toBeVisible()
    expect(
      screen.getByRole('heading', {name: 'Contact the studio'}),
    ).toBeVisible()
  })

  it('does not publish a developer mailbox when Studio contact data is absent', async () => {
    getPublicContactInfo.mockResolvedValueOnce(null)

    render(await ContactPage())

    expect(screen.queryByText('support@mucahid.dev')).toBeNull()
    expect(
      screen.getByRole('heading', {name: 'Contact the studio'}),
    ).toBeVisible()
  })
})
