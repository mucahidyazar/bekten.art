import {renderToStaticMarkup} from 'react-dom/server'
import {describe, expect, it, vi} from 'vitest'

const navigation = vi.hoisted(() => ({pathname: '/tr/journal/winter-light'}))

vi.mock('next/headers', () => ({
  headers: () =>
    Promise.resolve({
      get: (key: string) => (key === 'x-pathname' ? navigation.pathname : null),
    }),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

import {Breadcrumb, buildBreadcrumbItems} from './breadcrumb'
import {buildLocalizedLinks, HrefLang} from './hreflang'
import {
  ArtworkStructuredData,
  BreadcrumbStructuredData,
  OrganizationStructuredData,
  PersonStructuredData,
  WebsiteStructuredData,
} from './structured-data'

describe('localized SEO components', () => {
  it('builds canonical and hreflang URLs from the shared localized path helper', () => {
    expect(buildLocalizedLinks('/tr/news/42', 'https://bekten.art')).toEqual({
      canonical: 'https://bekten.art/tr/news/42',
      alternates: [
        {hrefLang: 'en-US', href: 'https://bekten.art/en/news/42'},
        {hrefLang: 'tr-TR', href: 'https://bekten.art/tr/news/42'},
        {hrefLang: 'ru-RU', href: 'https://bekten.art/ru/news/42'},
        {hrefLang: 'ky-KG', href: 'https://bekten.art/ky/news/42'},
        {hrefLang: 'x-default', href: 'https://bekten.art/en/news/42'},
      ],
    })

    expect(
      buildLocalizedLinks('/kg/about', 'https://bekten.art').canonical,
    ).toBe('https://bekten.art/ky/about')
    expect(buildLocalizedLinks('/about', 'https://bekten.art').canonical).toBe(
      'https://bekten.art/en/about',
    )
  })

  it('keeps V2 breadcrumb labels and URLs within the active locale', () => {
    expect(buildBreadcrumbItems('/ky/works/silent-steppe')).toEqual([
      {name: 'Башкы бет', url: '/ky'},
      {name: 'Эмгектер', url: '/ky/works'},
      {name: 'Silent Steppe', url: '/ky/works/silent-steppe'},
    ])
    expect(buildBreadcrumbItems('/kg/private-viewings')).toEqual([
      {name: 'Башкы бет', url: '/ky'},
      {name: 'Жеке көрүү', url: '/ky/private-viewings'},
    ])
    expect(buildBreadcrumbItems('/custom-page')).toEqual([
      {name: 'Home', url: '/en'},
      {name: 'Custom Page', url: '/en/custom-page'},
    ])
  })

  it('renders localized breadcrumb navigation and route-aware link tags', async () => {
    const breadcrumb = renderToStaticMarkup(await Breadcrumb({}))
    const links = renderToStaticMarkup(
      <HrefLang locales={['en', 'tr', 'ru', 'ky', 'invalid']} />,
    )

    expect(breadcrumb).toContain('aria-current="page"')
    expect(breadcrumb).toContain('href="/tr/journal"')
    expect(links).toContain(
      'rel="canonical" href="https://bekten.art/tr/journal/winter-light"',
    )
    expect(links).toContain('hrefLang="ky-KG"')
    expect(links).not.toContain('invalid')
  })

  it('does not render breadcrumbs on a localized home page', async () => {
    navigation.pathname = '/en'

    expect(renderToStaticMarkup(await Breadcrumb({}))).toBe('')

    navigation.pathname = '/tr/journal/winter-light'
  })

  it('does not advertise a search endpoint that does not exist', () => {
    const markup = renderToStaticMarkup(
      <WebsiteStructuredData
        name="Bekten Art"
        description="Artist portfolio"
        url="https://bekten.art"
      />,
    )

    expect(markup).not.toContain('SearchAction')
    expect(markup).not.toContain('/search')
  })

  it('escapes JSON-LD content so user-controlled text cannot close the script', () => {
    const markup = renderToStaticMarkup(
      <BreadcrumbStructuredData
        items={[
          {
            name: '</script><script>alert(1)</script>',
            url: 'https://bekten.art/en',
          },
        ]}
      />,
    )

    expect(markup).not.toContain('</script><script>alert(1)</script>')
    expect(markup).toContain('\\u003c/script')
  })

  it('renders complete person, organization and artwork schemas', () => {
    const artwork = renderToStaticMarkup(
      <ArtworkStructuredData
        name="Portrait"
        description="Oil portrait"
        image="https://bekten.art/media/portrait.jpg"
        creator="Bekten Usubaliev"
        dateCreated="2026"
        artMedium="Oil"
        artworkSurface="Canvas"
        url="https://bekten.art/en/gallery/portrait"
      />,
    )
    const organization = renderToStaticMarkup(
      <OrganizationStructuredData
        name="Bekten Art"
        description="Artist studio"
        url="https://bekten.art"
        logo="https://bekten.art/svg/logo.svg"
        sameAs={['https://instagram.com/bekten_usubaliev']}
        contactPoint={{telephone: '+996500007926', contactType: 'support'}}
      />,
    )
    const organizationWithoutContact = renderToStaticMarkup(
      <OrganizationStructuredData
        name="Bekten Art"
        description="Artist studio"
        url="https://bekten.art"
        logo="https://bekten.art/svg/logo.svg"
      />,
    )
    const person = renderToStaticMarkup(
      <PersonStructuredData
        name="Bekten Usubaliev"
        description="Artist"
        url="https://bekten.art"
        image="https://bekten.art/me.jpg"
        jobTitle="Painter"
        nationality="Kyrgyzstani"
        birthPlace="Kyrgyzstan"
      />,
    )

    expect(artwork).toContain('CreativeWork')
    expect(artwork).toContain('Oil portrait')
    expect(organization).toContain('ContactPoint')
    expect(organizationWithoutContact).not.toContain('ContactPoint')
    expect(person).toContain('Occupation')
  })
})
