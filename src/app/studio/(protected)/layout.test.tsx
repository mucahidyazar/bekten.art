import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
  requireStudioEditor: vi.fn(),
}))

vi.mock('next/navigation', () => ({redirect: mocks.redirect}))
vi.mock('@/server/studio-auth/configured-access', () => ({
  requireStudioEditor: mocks.requireStudioEditor,
}))

import StudioProtectedLayout from './layout'

describe('Studio protected layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudioEditor.mockResolvedValue({id: 'editor-1', role: 'EDITOR'})
  })

  it('renders the private Studio shell for a current editor', async () => {
    render(
      await StudioProtectedLayout({
        children: <p>Private dashboard</p>,
      }),
    )

    expect(screen.getByRole('banner')).toHaveTextContent('Bekten Studio')
    expect(screen.getByRole('main')).toHaveTextContent('Private dashboard')
    expect(screen.getByRole('link', {name: 'Skip to Studio content'})).toHaveAttribute(
      'href',
      '#studio-content',
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
    expect(mocks.redirect).toHaveBeenCalledWith('/studio/sign-in')
  })
})
