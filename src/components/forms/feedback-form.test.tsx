import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {FeedbackForm} from './feedback-form'

afterEach(() => vi.unstubAllGlobals())

describe('FeedbackForm', () => {
  it(
    'submits an accessible consented contact request and announces success',
    async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({success: true}), {
          headers: {'content-type': 'application/json'},
          status: 202,
        }),
      )

      vi.stubGlobal('fetch', fetchMock)
      const user = userEvent.setup()

      render(<FeedbackForm locale="en" />)

      await user.type(screen.getByLabelText('Full name'), 'Ada Lovelace')
      await user.type(screen.getByLabelText('Email address'), 'ada@example.com')
      await user.type(screen.getByLabelText('Subject'), 'Artwork enquiry')
      await user.type(
        screen.getByLabelText('Message'),
        'I would like to ask about an original artwork.',
      )
      await user.click(
        screen.getByRole('checkbox', {name: /privacy policy/i}),
      )
      await user.click(screen.getByRole('button', {name: 'Send message'}))

      await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
      expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
        email: 'ada@example.com',
        locale: 'en',
        message: 'I would like to ask about an original artwork.',
        name: 'Ada Lovelace',
        privacyAccepted: true,
        subject: 'Artwork enquiry',
        website: '',
      })
      expect(await screen.findByRole('status')).toHaveTextContent(
        'Your message has been received.',
      )
    },
    15_000,
  )

  it('keeps the form available and announces a generic delivery error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, {status: 500})),
    )
    const user = userEvent.setup()

    render(<FeedbackForm locale="en" />)

    await user.type(screen.getByLabelText('Full name'), 'Ada Lovelace')
    await user.type(screen.getByLabelText('Email address'), 'ada@example.com')
    await user.type(screen.getByLabelText('Subject'), 'Artwork enquiry')
    await user.type(
      screen.getByLabelText('Message'),
      'I would like to ask about an original artwork.',
    )
    await user.click(
      screen.getByRole('checkbox', {name: /privacy policy/i}),
    )
    await user.click(screen.getByRole('button', {name: 'Send message'}))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not send your message. Please try again.',
    )
    expect(screen.getByRole('button', {name: 'Send message'})).toBeEnabled()
  })
})
