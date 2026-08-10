// @vitest-environment jsdom

import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {Navbar} from './navbar'

vi.mock('next/link', () => ({
  default: ({children, href, ...props}: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/',
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

describe('Navbar', () => {
  it('links only to the valid account-free public bridge routes', () => {
    render(<Navbar />)

    expect(
      screen.getAllByRole('link').map(link => link.getAttribute('href')),
    ).toEqual(['/en', '/en/news', '/en/about', '/en/gallery', '/en/contact'])
  })
})
