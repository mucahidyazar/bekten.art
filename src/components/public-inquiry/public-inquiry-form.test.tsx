import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {PublicInquiryForm} from './public-inquiry-form'

const artwork = {
  id: '123e4567-e89b-42d3-a456-426614174001',
  medium: 'Oil on canvas',
  title: 'Mountain Memory',
  year: 2024,
} as const

function acceptedResponse() {
  return new Response(
    JSON.stringify({
      message: 'Your private request has been received.',
      success: true,
    }),
    {headers: {'content-type': 'application/json'}, status: 202},
  )
}

async function fillContactFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Full name'), 'Ada Collector')
  await user.type(screen.getByLabelText('Email address'), 'ada@example.com')
  await user.type(
    screen.getByLabelText('Phone (optional)'),
    '+90 555 123 45 67',
  )
  await user.click(screen.getByRole('checkbox', {name: /privacy policy/i}))
}

function submittedBody(fetchMock: ReturnType<typeof vi.fn>, call = 0) {
  return JSON.parse(String(fetchMock.mock.calls[call]?.[1]?.body)) as Record<
    string,
    unknown
  >
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('PublicInquiryForm', () => {
  it('submits an accessible artwork availability request with context and a honeypot', async () => {
    const fetchMock = vi.fn().mockResolvedValue(acceptedResponse())

    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '123e4567-e89b-42d3-a456-426614174000',
    )
    const user = userEvent.setup()

    const {container} = render(
      <PublicInquiryForm
        artwork={artwork}
        className="inquiry-placement"
        locale="en"
        type="AVAILABILITY"
      />,
    )

    expect(
      screen.getByRole('heading', {name: 'Availability inquiry'}),
    ).toBeVisible()
    expect(screen.getByText('Mountain Memory')).toBeVisible()
    expect(screen.getByText(/2024 · Oil on canvas/)).toBeVisible()
    expect(container.firstElementChild).toHaveClass('inquiry-placement')
    expect(container.querySelector('input[name="website"]')).toHaveAttribute(
      'tabindex',
      '-1',
    )

    await fillContactFields(user)
    await user.type(
      screen.getByLabelText('Your note (optional)'),
      'Please share the private viewing options for this work.',
    )
    await user.click(screen.getByRole('button', {name: 'Send private request'}))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(fetchMock).toHaveBeenCalledWith('/api/inquiries', {
      body: expect.any(String),
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
    })
    expect(submittedBody(fetchMock)).toEqual({
      consent: true,
      email: 'ada@example.com',
      locale: 'en',
      message: 'Please share the private viewing options for this work.',
      name: 'Ada Collector',
      phone: '+90 555 123 45 67',
      relatedArtworkId: artwork.id,
      submissionId: '123e4567-e89b-42d3-a456-426614174000',
      type: 'AVAILABILITY',
      website: '',
    })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Your private request has been received.',
    )
  })

  it('submits only the commission fields required by the API contract', async () => {
    const fetchMock = vi.fn().mockResolvedValue(acceptedResponse())

    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<PublicInquiryForm locale="en" type="COMMISSION" />)
    await fillContactFields(user)
    await user.type(
      screen.getByLabelText('Commission brief'),
      'A contemplative landscape for a quiet residential collection.',
    )
    await user.type(
      screen.getByLabelText('Preferred timeline (optional)'),
      'Autumn 2027',
    )
    await user.click(screen.getByRole('button', {name: 'Send private request'}))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(submittedBody(fetchMock)).toMatchObject({
      brief: 'A contemplative landscape for a quiet residential collection.',
      preferredTimeline: 'Autumn 2027',
      type: 'COMMISSION',
    })
    expect(submittedBody(fetchMock)).not.toHaveProperty('message')
    expect(submittedBody(fetchMock)).not.toHaveProperty('relatedArtworkId')
  })

  it('submits one to three private viewing dates and optional artwork context', async () => {
    const fetchMock = vi.fn().mockResolvedValue(acceptedResponse())

    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(
      <PublicInquiryForm
        artwork={artwork}
        locale="en"
        type="PRIVATE_VIEWING"
      />,
    )
    await fillContactFields(user)
    await user.type(screen.getByLabelText('Preferred date'), '2027-04-12')
    await user.type(
      screen.getByLabelText('Alternative date (optional)'),
      '2027-04-13',
    )
    await user.type(screen.getByLabelText('Attendees (optional)'), '3')
    await user.click(screen.getByRole('button', {name: 'Send private request'}))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(submittedBody(fetchMock)).toMatchObject({
      attendees: 3,
      preferredDates: ['2027-04-12', '2027-04-13'],
      relatedArtworkId: artwork.id,
      type: 'PRIVATE_VIEWING',
    })
  })

  it('omits empty optional private-viewing fields and supports a custom privacy route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(acceptedResponse())

    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(
      <PublicInquiryForm
        locale="en"
        privacyPolicyHref="/en/privacy"
        type="PRIVATE_VIEWING"
      />,
    )
    expect(screen.getByRole('link', {name: 'Privacy Policy'})).toHaveAttribute(
      'href',
      '/en/privacy',
    )

    await user.type(screen.getByLabelText('Full name'), 'Ada Collector')
    await user.type(screen.getByLabelText('Email address'), 'ada@example.com')
    await user.type(screen.getByLabelText('Preferred date'), '2027-04-12')
    await user.type(
      screen.getByLabelText('Your note (optional)'),
      'I would prefer a calm morning appointment at the studio.',
    )
    await user.click(screen.getByRole('checkbox', {name: /privacy policy/i}))
    await user.click(screen.getByRole('button', {name: 'Send private request'}))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(submittedBody(fetchMock)).toMatchObject({
      message: 'I would prefer a calm morning appointment at the studio.',
      preferredDates: ['2027-04-12'],
      type: 'PRIVATE_VIEWING',
    })
    expect(submittedBody(fetchMock)).not.toHaveProperty('attendees')
    expect(submittedBody(fetchMock)).not.toHaveProperty('phone')
    expect(submittedBody(fetchMock)).not.toHaveProperty('relatedArtworkId')
  })

  it('supports title-only artwork context and omits an empty availability note', async () => {
    const fetchMock = vi.fn().mockResolvedValue(acceptedResponse())

    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(
      <PublicInquiryForm
        artwork={{id: artwork.id, title: artwork.title}}
        locale="en"
        type="AVAILABILITY"
      />,
    )
    expect(screen.queryByText(/Oil on canvas/)).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Full name'), 'Ada Collector')
    await user.type(screen.getByLabelText('Email address'), 'ada@example.com')
    await user.click(screen.getByRole('checkbox', {name: /privacy policy/i}))
    await user.click(screen.getByRole('button', {name: 'Send private request'}))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(submittedBody(fetchMock)).not.toHaveProperty('message')
  })

  it('submits the general inquiry subject and message without sales language', async () => {
    const fetchMock = vi.fn().mockResolvedValue(acceptedResponse())

    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<PublicInquiryForm locale="en" type="GENERAL" />)
    await fillContactFields(user)
    await user.type(screen.getByLabelText('Subject'), 'Archive research')
    await user.type(
      screen.getByLabelText('Message'),
      'I would like to ask about the studio archive and artist materials.',
    )
    await user.click(screen.getByRole('button', {name: 'Send private request'}))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(submittedBody(fetchMock)).toMatchObject({
      message:
        'I would like to ask about the studio archive and artist materials.',
      subject: 'Archive research',
      type: 'GENERAL',
    })
    expect(screen.queryByText(/buy|price|cart|sale/i)).not.toBeInTheDocument()
  })

  it('keeps one submission id across a failed delivery and its retry', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, {status: 500}))
      .mockResolvedValueOnce(acceptedResponse())

    vi.stubGlobal('fetch', fetchMock)
    const randomUUID = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValue('123e4567-e89b-42d3-a456-426614174000')
    const user = userEvent.setup()

    render(<PublicInquiryForm locale="en" type="GENERAL" />)
    await fillContactFields(user)
    await user.type(screen.getByLabelText('Subject'), 'Studio archive')
    await user.type(
      screen.getByLabelText('Message'),
      'Please share further information about the studio archive.',
    )
    await user.click(screen.getByRole('button', {name: 'Send private request'}))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not receive your request. Please try again.',
    )
    await user.click(screen.getByRole('button', {name: 'Send private request'}))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Your private request has been received.',
    )
    expect(randomUUID).toHaveBeenCalledOnce()
    expect(submittedBody(fetchMock, 0).submissionId).toBe(
      submittedBody(fetchMock, 1).submissionId,
    )
  })

  it('creates a new submission id when a failed request is edited before retry', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, {status: 500}))
      .mockResolvedValueOnce(acceptedResponse())

    vi.stubGlobal('fetch', fetchMock)
    const randomUUID = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('123e4567-e89b-42d3-a456-426614174000')
      .mockReturnValueOnce('123e4567-e89b-42d3-a456-426614174002')
    const user = userEvent.setup()

    render(<PublicInquiryForm locale="en" type="GENERAL" />)
    await fillContactFields(user)
    await user.type(screen.getByLabelText('Subject'), 'Studio archive')
    await user.type(
      screen.getByLabelText('Message'),
      'Please share further information about the studio archive.',
    )
    await user.click(screen.getByRole('button', {name: 'Send private request'}))
    expect(await screen.findByRole('alert')).toBeVisible()

    await user.clear(screen.getByLabelText('Message'))
    await user.type(
      screen.getByLabelText('Message'),
      'Please share further information about the exhibition archive.',
    )
    await user.click(screen.getByRole('button', {name: 'Send private request'}))

    expect(await screen.findByRole('status')).toBeVisible()
    expect(randomUUID).toHaveBeenCalledTimes(2)
    expect(submittedBody(fetchMock, 0).submissionId).not.toBe(
      submittedBody(fetchMock, 1).submissionId,
    )
  })

  it('honors Retry-After and prevents immediate rate-limit resubmission', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        headers: {'Retry-After': '1'},
        status: 429,
      }),
    )

    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<PublicInquiryForm locale="en" type="GENERAL" />)
    await fillContactFields(user)
    await user.type(screen.getByLabelText('Subject'), 'Studio archive')
    await user.type(
      screen.getByLabelText('Message'),
      'Please share further information about the studio archive.',
    )
    await user.click(screen.getByRole('button', {name: 'Send private request'}))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please wait before trying again. Retry in 1 s.',
    )
    const submit = screen.getByRole('button', {name: 'Send private request'})

    expect(submit).toBeDisabled()
    await user.click(submit)
    expect(fetchMock).toHaveBeenCalledOnce()

    await waitFor(() => expect(submit).toBeEnabled(), {timeout: 1_500})
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('disables every interactive field while the request is pending', async () => {
    let resolveRequest: ((value: Response) => void) | undefined

    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>(resolve => {
            resolveRequest = resolve
          }),
      ),
    )
    const user = userEvent.setup()

    render(<PublicInquiryForm locale="en" type="GENERAL" />)
    await fillContactFields(user)
    await user.type(screen.getByLabelText('Subject'), 'Studio archive')
    await user.type(
      screen.getByLabelText('Message'),
      'Please share further information about the studio archive.',
    )
    await user.click(screen.getByRole('button', {name: 'Send private request'}))

    expect(screen.getByRole('button', {name: 'Sending request'})).toBeDisabled()
    for (const control of screen.getAllByRole('textbox')) {
      expect(control).toBeDisabled()
    }
    expect(screen.getByRole('checkbox')).toBeDisabled()

    resolveRequest?.(acceptedResponse())
    expect(await screen.findByRole('status')).toBeVisible()
  })

  it('never exposes an API or network error and retains the completed form', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValue(
          new Error('postgresql://private-user:secret@database'),
        ),
    )
    const user = userEvent.setup()

    render(<PublicInquiryForm locale="en" type="GENERAL" />)
    await fillContactFields(user)
    await user.type(screen.getByLabelText('Subject'), 'Studio archive')
    await user.type(
      screen.getByLabelText('Message'),
      'Please share further information about the studio archive.',
    )
    await user.click(screen.getByRole('button', {name: 'Send private request'}))

    const alert = await screen.findByRole('alert')

    expect(alert).toHaveTextContent(
      'We could not receive your request. Please try again.',
    )
    expect(alert).not.toHaveTextContent('secret')
    expect(screen.getByLabelText('Email address')).toHaveValue(
      'ada@example.com',
    )
    expect(
      screen.getByRole('button', {name: 'Send private request'}),
    ).toBeEnabled()
  })

  it('recovers with a generic error if a secure submission id cannot be created', async () => {
    const fetchMock = vi.fn()

    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(() => {
      throw new Error('browser internals must stay private')
    })
    const user = userEvent.setup()

    render(<PublicInquiryForm locale="en" type="GENERAL" />)
    await fillContactFields(user)
    await user.type(screen.getByLabelText('Subject'), 'Studio archive')
    await user.type(
      screen.getByLabelText('Message'),
      'Please share further information about the studio archive.',
    )
    await user.click(screen.getByRole('button', {name: 'Send private request'}))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not receive your request. Please try again.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', {name: 'Send private request'}),
    ).toBeEnabled()
  })

  it('renders localized field errors and focuses the first invalid control', async () => {
    const fetchMock = vi.fn()

    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<PublicInquiryForm locale="tr" type="GENERAL" />)
    await user.click(screen.getByRole('button', {name: 'Özel talep gönder'}))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Lütfen işaretli alanları kontrol edin.',
    )
    const name = screen.getByLabelText('Ad soyad')

    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(name.getAttribute('aria-describedby')).toContain(`${name.id}-error`)
    expect(name).toHaveFocus()
    expect(screen.getAllByText('Bu alan zorunludur.').length).toBeGreaterThan(0)
    expect(fetchMock).not.toHaveBeenCalled()

    await user.type(name, 'Ada')
    expect(name).not.toHaveAttribute('aria-invalid')
    expect(name).not.toHaveAttribute('aria-describedby')
  })

  it.each([
    ['tr', 'Özel talep gönder'],
    ['ru', 'Отправить частный запрос'],
    ['ky', 'Жеке өтүнүч жөнөтүү'],
  ] as const)('localizes the complete form action for %s', (locale, action) => {
    render(<PublicInquiryForm locale={locale} type="GENERAL" />)

    expect(screen.getByRole('button', {name: action})).toBeVisible()
    expect(screen.getByLabelText(/e-posta|электрон/i)).toBeVisible()
  })
})
