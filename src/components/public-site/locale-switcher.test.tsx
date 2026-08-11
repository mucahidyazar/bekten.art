import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {buildLocaleSiblingPath, LocaleSwitcher} from './locale-switcher'

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/works/silent-steppe',
}))

describe('public locale switcher', () => {
  it('preserves the current editorial path while replacing the locale', () => {
    expect(buildLocaleSiblingPath('/en/works/silent-steppe', 'tr')).toBe(
      '/tr/works',
    )
    expect(buildLocaleSiblingPath('/en/commission-a-work', 'tr')).toBe(
      '/tr/commission-a-work',
    )
    expect(buildLocaleSiblingPath('/kg/collections', 'ky')).toBe(
      '/ky/collections',
    )
    expect(buildLocaleSiblingPath('/', 'ru')).toBe('/ru')
    expect(buildLocaleSiblingPath('/tr/commission-a-work', 'en')).toBe(
      '/commission-a-work',
    )
    expect(buildLocaleSiblingPath('/tr/works/sessiz-bozkir', 'en')).toBe(
      '/works',
    )
    expect(buildLocaleSiblingPath('/tr', 'en')).toBe('/')
  })

  it('exposes all supported languages with the current locale announced', () => {
    render(<LocaleSwitcher locale="en" />)

    expect(screen.getByRole('navigation', {name: 'Languages'})).toBeVisible()
    expect(screen.getByRole('link', {name: 'English'})).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', {name: 'English'})).toHaveAttribute(
      'href',
      '/works',
    )
    expect(screen.getByRole('link', {name: 'Türkçe'})).toHaveAttribute(
      'href',
      '/tr/works',
    )
    expect(screen.getByRole('link', {name: 'Кыргызча'})).toHaveAttribute(
      'href',
      '/ky/works',
    )
  })

  it('localizes the language navigation landmark', () => {
    render(<LocaleSwitcher locale="tr" />)

    expect(screen.getByRole('navigation', {name: 'Diller'})).toBeVisible()
  })

  it('shows an active registered language with English shell fallback', () => {
    render(
      <LocaleSwitcher
        locale="de"
        locales={[
          {code: 'en', nativeName: 'English'},
          {code: 'de', nativeName: 'Deutsch'},
        ]}
      />,
    )

    expect(screen.getByRole('navigation', {name: 'Languages'})).toBeVisible()
    expect(screen.getByRole('link', {name: 'Deutsch'})).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', {name: 'Deutsch'})).toHaveAttribute(
      'href',
      '/de/works',
    )
  })
})
