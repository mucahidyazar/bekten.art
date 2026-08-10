import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

const {notFoundMock} = vi.hoisted(() => ({notFoundMock: vi.fn()}))

vi.mock('next/navigation', () => ({notFound: notFoundMock}))

import NewsletterPreferencesPage from './page'

describe('NewsletterPreferencesPage', () => {
  it.each([
    ['newsletter-confirm', '/api/newsletter/confirm'],
    ['newsletter-unsubscribe', '/api/newsletter/unsubscribe'],
  ] as const)(
    'renders the explicit %s POST confirmation',
    async (action, endpoint) => {
      render(
        await NewsletterPreferencesPage({
          params: Promise.resolve({locale: 'en'}),
          searchParams: Promise.resolve({action}),
        }),
      )

      expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
        'Confirm newsletter preference',
      )
      expect(screen.getByRole('button', {name: 'Confirm action'})).toBeVisible()
      expect(screen.getByRole('button').closest('form')).toHaveAttribute(
        'action',
        endpoint,
      )
    },
  )

  it('rejects an unknown action', async () => {
    await NewsletterPreferencesPage({
      params: Promise.resolve({locale: 'en'}),
      searchParams: Promise.resolve({action: 'verify-email'}),
    })

    expect(notFoundMock).toHaveBeenCalledOnce()
  })
})
