import {expect, test} from '@playwright/test'

import {startWithOptionalConsentDenied} from './helpers/consent'

import type {Page, Request} from '@playwright/test'

const submissionIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu

type CapturedInquiry = Readonly<{
  body: Readonly<Record<string, unknown>>
  headers: Readonly<Record<string, string>>
  method: string
  url: string
}>

async function expectInquiryPage(
  page: Page,
  route: string,
  formHeading: string,
) {
  const response = await page.goto(route)

  expect(
    response?.ok(),
    `${route} requires its managed page to be published in the E2E database`,
  ).toBe(true)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', {name: formHeading})).toBeVisible()
}

async function captureInquiryRequests(page: Page) {
  let count = 0
  let submission: CapturedInquiry | undefined

  await page.route('**/api/inquiries', async route => {
    const request = route.request()

    count += 1
    submission ??= capturedInquiry(request)
    await route.fulfill({
      body: JSON.stringify({
        message: 'Your private request has been received.',
        success: true,
      }),
      contentType: 'application/json',
      status: 202,
    })
  })

  return Object.freeze({
    read: () => Object.freeze({count, submission}),
  })
}

function capturedInquiry(request: Request): CapturedInquiry {
  return Object.freeze({
    body: Object.freeze(
      request.postDataJSON() as Readonly<Record<string, unknown>>,
    ),
    headers: Object.freeze({...request.headers()}),
    method: request.method(),
    url: request.url(),
  })
}

async function fillContactFields(page: Page) {
  await page.getByLabel('Full name').fill('Playwright Collector')
  await page.getByLabel('Email address').fill('collector@example.com')
}

function expectNetworkContract(
  page: Page,
  submission: CapturedInquiry | undefined,
) {
  expect(submission).toBeDefined()
  expect(submission?.method).toBe('POST')
  const requestUrl = new URL(submission?.url ?? 'http://invalid.local')

  expect(requestUrl.origin).toBe(new URL(page.url()).origin)
  expect(requestUrl.pathname).toBe('/api/inquiries')
  expect(submission?.headers['content-type']).toContain('application/json')
}

test.describe('V2 premium public inquiries', () => {
  test.beforeEach(async ({page}) => {
    await startWithOptionalConsentDenied(page)
  })

  test('requires explicit privacy consent before a GENERAL inquiry leaves the browser', async ({
    page,
  }) => {
    const inquiryRequests = await captureInquiryRequests(page)

    await expectInquiryPage(page, '/contact', 'Contact the studio')
    await fillContactFields(page)
    await page.getByLabel('Subject').fill('Archive research')
    await page
      .getByRole('textbox', {name: 'Message', exact: true})
      .fill('Please share further information about the studio archive.')
    await expect(
      page.getByRole('link', {name: 'Privacy Policy'}),
    ).toHaveAttribute('href', '/privacy-policy')
    await page.getByRole('button', {name: 'Send private request'}).click()

    const consent = page.getByRole('checkbox', {name: /privacy policy/i})

    await expect(consent).toBeFocused()
    await expect(consent).toHaveAttribute('aria-invalid', 'true')
    await expect(
      page
        .getByRole('alert')
        .filter({hasText: 'Please review the highlighted fields.'}),
    ).toBeVisible()
    expect(inquiryRequests.read()).toEqual({count: 0, submission: undefined})
  })

  test('submits the GENERAL contact contract to the same-origin inquiry API', async ({
    page,
  }) => {
    const inquiryRequests = await captureInquiryRequests(page)

    await expectInquiryPage(page, '/contact', 'Contact the studio')
    await fillContactFields(page)
    await page.getByLabel('Subject').fill('Archive research')
    await page
      .getByRole('textbox', {name: 'Message', exact: true})
      .fill('Please share further information about the studio archive.')
    await page.getByRole('checkbox', {name: /privacy policy/i}).check()
    await page.getByRole('button', {name: 'Send private request'}).click()

    await expect(page.getByRole('status')).toContainText(
      'Your private request has been received.',
    )
    const captured = inquiryRequests.read()

    expect(captured.count).toBe(1)
    expectNetworkContract(page, captured.submission)
    expect(captured.submission?.body).toEqual({
      consent: true,
      email: 'collector@example.com',
      locale: 'en',
      message: 'Please share further information about the studio archive.',
      name: 'Playwright Collector',
      subject: 'Archive research',
      submissionId: expect.stringMatching(submissionIdPattern),
      type: 'GENERAL',
      website: '',
    })
  })

  test('submits the COMMISSION brief and timeline contract', async ({page}) => {
    const inquiryRequests = await captureInquiryRequests(page)

    await expectInquiryPage(page, '/commission-a-work', 'Commission inquiry')
    await fillContactFields(page)
    await page.getByLabel('Preferred timeline (optional)').fill('Autumn 2027')
    await page
      .getByLabel('Commission brief')
      .fill('A contemplative landscape for a quiet residential collection.')
    await page.getByRole('checkbox', {name: /privacy policy/i}).check()
    await page.getByRole('button', {name: 'Send private request'}).click()

    await expect(page.getByRole('status')).toContainText(
      'Your private request has been received.',
    )
    const captured = inquiryRequests.read()

    expect(captured.count).toBe(1)
    expectNetworkContract(page, captured.submission)
    expect(captured.submission?.body).toEqual({
      brief: 'A contemplative landscape for a quiet residential collection.',
      consent: true,
      email: 'collector@example.com',
      locale: 'en',
      name: 'Playwright Collector',
      preferredTimeline: 'Autumn 2027',
      submissionId: expect.stringMatching(submissionIdPattern),
      type: 'COMMISSION',
      website: '',
    })
  })

  test('submits the PRIVATE_VIEWING dates and attendees contract', async ({
    page,
  }) => {
    const inquiryRequests = await captureInquiryRequests(page)

    await expectInquiryPage(page, '/private-viewings', 'Private viewing')
    await fillContactFields(page)
    await page.getByLabel('Preferred date').fill('2027-04-12')
    await page.getByLabel('Alternative date (optional)').fill('2027-04-13')
    await page.getByLabel('Attendees (optional)').fill('3')
    await page
      .getByLabel('Your note (optional)')
      .fill('A calm morning appointment at the studio would be ideal.')
    await page.getByRole('checkbox', {name: /privacy policy/i}).check()
    await page.getByRole('button', {name: 'Send private request'}).click()

    await expect(page.getByRole('status')).toContainText(
      'Your private request has been received.',
    )
    const captured = inquiryRequests.read()

    expect(captured.count).toBe(1)
    expectNetworkContract(page, captured.submission)
    expect(captured.submission?.body).toEqual({
      attendees: 3,
      consent: true,
      email: 'collector@example.com',
      locale: 'en',
      message: 'A calm morning appointment at the studio would be ideal.',
      name: 'Playwright Collector',
      preferredDates: ['2027-04-12', '2027-04-13'],
      submissionId: expect.stringMatching(submissionIdPattern),
      type: 'PRIVATE_VIEWING',
      website: '',
    })
  })
})
