import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, describe, expect, it, vi} from 'vitest'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string) => {
    const values: Record<string, string> = {
      'cta.newsletter.description': 'Newsletter description',
      'cta.newsletter.placeholder': 'Enter your email address',
      'cta.newsletter.title': 'Stay Updated',
      'forms.buttons.subscribe': 'Subscribe',
      'forms.buttons.subscribing': 'Subscribing...',
      'forms.messages.noSpam': 'No spam',
      'forms.messages.subscribeDescription': 'Check your inbox.',
      'forms.messages.subscribeSuccess': 'Subscription requested',
      'forms.messages.unsubscribeAnytime': 'Unsubscribe anytime',
      'forms.messages.weeklyUpdates': 'Weekly updates',
    }

    return values[`${namespace}.${key}`] ?? key
  },
}))

import {NewsletterCTA} from './newsletter-cta'

afterEach(() => vi.unstubAllGlobals())

describe('NewsletterCTA', () => {
  it('requires consent, requests double opt-in and announces success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, {status: 202}))

    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<NewsletterCTA />)

    await user.type(
      screen.getByRole('textbox', {name: 'Email address'}),
      'ada@example.com',
    )
    await user.click(
      screen.getByRole('checkbox', {name: /newsletter emails/i}),
    )
    await user.click(screen.getByRole('button', {name: 'Subscribe'}))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      consent: true,
      email: 'ada@example.com',
      locale: 'en',
      source: 'newsletter',
      website: '',
    })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Subscription requested',
    )
  })

  it('announces a retryable generic error without clearing the address', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, {status: 500})),
    )
    const user = userEvent.setup()

    render(<NewsletterCTA />)

    const email = screen.getByRole('textbox', {name: 'Email address'})

    await user.type(email, 'ada@example.com')
    await user.click(
      screen.getByRole('checkbox', {name: /newsletter emails/i}),
    )
    await user.click(screen.getByRole('button', {name: 'Subscribe'}))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not start your subscription. Please try again.',
    )
    expect(email).toHaveValue('ada@example.com')
  })
})
