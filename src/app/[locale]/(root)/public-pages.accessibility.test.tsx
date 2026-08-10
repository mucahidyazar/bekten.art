// @vitest-environment jsdom

import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import ContactPage from './contact/page'
import RootLayout from './layout'

vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getTranslations: async () => (key: string) => key,
}))
vi.mock('@/utils/prepare-metadata', () => ({prepareMetadata: vi.fn()}))
vi.mock('@/server/contact/public-contact', () => ({
  getPublicContactInfo: async () => ({
    address: 'Bishkek',
    email: 'studio@example.test',
    mapEmbedUrl: 'https://maps.example.test/embed',
    name: 'Bekten',
    phone: '+996 555 000 000',
    socials: [],
    workingHours: '',
  }),
}))
vi.mock('@/components/footer', () => ({Footer: () => <footer>Footer</footer>}))
vi.mock('@/components/organisms/header', () => ({
  Header: () => <header>Header</header>,
}))
vi.mock('@/components/seo/breadcrumb', () => ({
  Breadcrumb: () => <nav aria-label="Breadcrumb">Breadcrumb</nav>,
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
    expect(
      screen.getByRole('navigation', {name: 'Breadcrumb'}),
    ).toBeInTheDocument()
  })

  it('keeps one page heading and names the contact map frame', async () => {
    render(await ContactPage())

    expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1)
    expect(screen.getByTitle(/studio map/i)).toBeVisible()
  })
})
