// @vitest-environment jsdom

import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {AppTools} from './app-tools'

const push = vi.fn()
const setTheme = vi.fn()

vi.mock('next/link', () => ({
  default: ({children, href, ...props}: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/gallery',
  useRouter: () => ({push}),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: {locale?: string}) =>
    values?.locale ?? (key === 'navigation.signIn' ? 'Sign in' : key),
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({setTheme, theme: 'system'}),
}))

vi.mock('@/hooks/use-hydrated', () => ({useHydrated: () => true}))
vi.mock('@/components/ui/fallback-image', () => ({
  FallbackImage: ({alt}: {alt: string}) => <span role="img" aria-label={alt} />,
}))

describe('AppTools accessibility', () => {
  beforeEach(() => {
    push.mockClear()
    setTheme.mockClear()
  })

  it('uses one interactive element for the sign-in link and names menu triggers', () => {
    const {container} = render(<AppTools />)

    const signIn = screen.getByRole('link', {name: /sign in/i})

    expect(signIn).toHaveAttribute('href', '/en/sign-in')
    expect(signIn.querySelector('button')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', {name: /change language/i}),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {name: /change color theme/i}),
    ).toBeInTheDocument()
    expect(container.querySelector('a button, button a')).toBeNull()
  })

  it('exposes locale choices as keyboard-operable menu items', async () => {
    const user = userEvent.setup()

    render(<AppTools />)

    await user.click(screen.getByRole('button', {name: /change language/i}))
    const turkish = await screen.findByRole('menuitem', {name: 'tr'})

    await user.keyboard('{ArrowDown}')
    await user.click(turkish)

    expect(push).toHaveBeenCalledWith('/tr/gallery')
  })
})
