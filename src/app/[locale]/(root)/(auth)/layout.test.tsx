// @vitest-environment jsdom

import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import AuthLayout from './layout'

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock('next/navigation', () => ({redirect: mocks.redirect}))
vi.mock('next-intl/server', () => ({
  getTranslations: ({locale}: {locale: string}) =>
    Promise.resolve((key: string) =>
      locale === 'tr'
        ? {signIn: 'Giriş yap', signUp: 'Kayıt ol'}[key as 'signIn' | 'signUp']
        : key,
    ),
}))
vi.mock('@/server/auth/access', () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}))
vi.mock('@/components/molecules/tabs', () => ({
  Tabs: ({tabs}: {tabs: {label: string; value: string}[]}) => (
    <nav aria-label="Authentication">
      {tabs.map(tab => (
        <a href={tab.value} key={tab.value}>
          {tab.label}
        </a>
      ))}
    </nav>
  ),
}))

describe('AuthLayout', () => {
  beforeEach(() => {
    mocks.getAuthenticatedUser.mockReset()
    mocks.redirect.mockReset()
  })

  it('uses localized authentication links for guests', async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null)

    render(
      await AuthLayout({
        children: <p>Sign in form</p>,
        params: Promise.resolve({locale: 'tr'}),
      }),
    )

    expect(screen.getByRole('link', {name: 'Giriş yap'})).toHaveAttribute(
      'href',
      '/tr/sign-in',
    )
    expect(screen.getByRole('link', {name: 'Kayıt ol'})).toHaveAttribute(
      'href',
      '/tr/sign-up',
    )
  })

  it('redirects an authenticated user to their localized profile', async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({id: 'user-id', role: 'USER'})

    await AuthLayout({
      children: <p>Sign in form</p>,
      params: Promise.resolve({locale: 'ky'}),
    })

    expect(mocks.redirect).toHaveBeenCalledWith('/ky/profile/user-id')
  })
})
