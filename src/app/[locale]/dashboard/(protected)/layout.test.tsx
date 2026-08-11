import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
  requireStudioEditor: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  usePathname: () => '/dashboard',
}))
vi.mock('@/server/studio-auth/configured-access', () => ({
  requireStudioEditor: mocks.requireStudioEditor,
}))

import StudioProtectedLayout from './layout'

describe('Studio protected layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudioEditor.mockResolvedValue({
      id: 'editor-1',
      role: 'EDITOR',
    })
  })

  it('renders the private Studio shell for a current editor', async () => {
    render(
      await StudioProtectedLayout({
        children: <p>Private dashboard</p>,
      }),
    )

    expect(screen.getByRole('banner')).toHaveTextContent('Bekten Studio')
    expect(screen.getByRole('main')).toHaveTextContent('Private dashboard')
    expect(
      screen.getByRole('link', {name: 'Skip to Studio content'}),
    ).toHaveAttribute('href', '#studio-content')
    expect(screen.getByRole('navigation', {name: 'Studio'})).toHaveTextContent(
      'Artworks',
    )
    expect(screen.getByRole('link', {name: 'Languages'})).toHaveAttribute(
      'href',
      '/dashboard/languages',
    )
    expect(screen.getByTestId('studio-shell')).toHaveAttribute(
      'data-shadcn-shell',
      'true',
    )
    expect(screen.getByTestId('studio-sidebar-header')).toHaveClass('h-16')
    expect(screen.getByRole('banner')).toHaveClass('h-16')
    expect(
      screen.getByTestId('studio-sidebar-header').querySelector('span'),
    ).toBeNull()
    expect(
      screen
        .getAllByRole('button', {name: 'Collapse Studio navigation'})
        .find(button => button.classList.contains('md:-right-[1.375rem]')),
    ).toHaveClass('md:-right-[1.375rem]')
    expect(
      screen.queryByRole('link', {name: 'Operations'}),
    ).not.toBeInTheDocument()
  })

  it('shows technical operations only to an owner', async () => {
    mocks.requireStudioEditor.mockResolvedValueOnce({
      id: 'owner-1',
      role: 'OWNER',
    })

    render(await StudioProtectedLayout({children: <p>Private dashboard</p>}))

    expect(screen.getByRole('link', {name: 'Operations'})).toHaveAttribute(
      'href',
      '/dashboard/operations',
    )
  })

  it('redirects an unauthenticated or unauthorized visitor to private sign-in', async () => {
    mocks.requireStudioEditor.mockRejectedValueOnce(
      Object.assign(new Error('Studio authentication required'), {
        statusCode: 401,
      }),
    )

    await expect(
      StudioProtectedLayout({children: <p>Private dashboard</p>}),
    ).rejects.toThrow('NEXT_REDIRECT')
    expect(mocks.redirect).toHaveBeenCalledWith('/dashboard/sign-in')
  })
})
