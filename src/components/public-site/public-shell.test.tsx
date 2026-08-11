import {render, screen, within} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

const navigation = vi.hoisted(() => ({pathname: '/works'}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}))

import {PublicFooter} from './public-footer'
import {PublicHeader} from './public-header'

describe('editorial public shell', () => {
  it.each([
    ['en', 'Works', 'Collections', 'Contact'],
    ['tr', 'Eserler', 'Koleksiyonlar', 'İletişim'],
    ['ru', 'Работы', 'Коллекции', 'Контакты'],
    ['ky', 'Эмгектер', 'Жыйнактар', 'Байланыш'],
  ] as const)(
    'renders locale-aware primary navigation for %s without account or commerce links',
    (locale, works, collections, inquire) => {
      render(<PublicHeader locale={locale} />)

      const header = screen.getByRole('banner')
      const navigation = within(header).getByRole('navigation', {
        name: /primary|ana|основная|негизги/iu,
      })

      expect(
        within(navigation).getByRole('link', {name: works}),
      ).toHaveAttribute('href', locale === 'en' ? '/works' : `/${locale}/works`)
      expect(
        within(navigation).getByRole('link', {name: collections}),
      ).toHaveAttribute(
        'href',
        locale === 'en' ? '/collections' : `/${locale}/collections`,
      )
      expect(
        within(navigation).getByRole('link', {
          name: /about|hakkında|о художнике|сүрөтчү/iu,
        }),
      ).toHaveAttribute('href', locale === 'en' ? '/about' : `/${locale}/about`)
      expect(
        within(navigation).getByRole('link', {name: inquire}),
      ).toHaveAttribute(
        'href',
        locale === 'en' ? '/contact' : `/${locale}/contact`,
      )
      expect(
        within(header).queryByText(/login|sign|profile|store|cart/iu),
      ).toBeNull()
      expect(
        within(header).getByText(/menu|menü|меню|бөлүмдөр/iu),
      ).toBeVisible()
    },
  )

  it('uses the original artwork logo and a prefixless English home link', () => {
    render(<PublicHeader locale="en" />)

    const home = screen.getByRole('link', {name: 'Bekten — Home'})

    expect(home).toHaveAttribute('href', '/')
    expect(home.querySelector('img')).toHaveAttribute(
      'src',
      '/svg/full-logo.svg',
    )
    expect(
      within(
        screen.getByRole('navigation', {name: 'Primary navigation'}),
      ).getByRole('link', {name: 'Works'}),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('provides a restrained contact footer and all premium inquiry paths', () => {
    render(<PublicFooter locale="en" />)

    const footer = screen.getByRole('contentinfo')

    expect(within(footer).getByRole('heading', {level: 2})).toHaveTextContent(
      'Begin a conversation',
    )
    expect(
      within(footer).getByRole('link', {name: 'Availability inquiry'}),
    ).toHaveAttribute('href', '/available-works')
    expect(
      within(footer).getByRole('link', {name: 'Commission'}),
    ).toHaveAttribute('href', '/commission-a-work')
    expect(
      within(footer).getByRole('link', {name: 'Private viewing'}),
    ).toHaveAttribute('href', '/private-viewings')
    expect(
      within(footer).queryByRole('link', {name: 'support@mucahid.dev'}),
    ).toBeNull()
    expect(within(footer).queryByText(/buy|shop|price|cart/iu)).toBeNull()
  })

  it('localizes footer navigation instead of leaking the default language', () => {
    render(<PublicFooter locale="tr" />)

    expect(screen.getByRole('link', {name: 'Gizlilik'})).toHaveAttribute(
      'href',
      '/tr/privacy-policy',
    )
    expect(screen.queryByRole('link', {name: 'Privacy'})).toBeNull()
  })
})
