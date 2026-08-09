import {expect, test} from '@playwright/test'

import {startWithOptionalConsentDenied} from './helpers/consent'

test.describe('public feedback validation', () => {
  test.beforeEach(async ({page}) => {
    await startWithOptionalConsentDenied(page)
    await page.goto('/en/contact')
  })

  test('keeps invalid feedback in the browser without an API request', async ({
    page,
  }) => {
    let feedbackPosts = 0

    page.on('request', request => {
      if (
        request.method() === 'POST' &&
        request.url().endsWith('/api/feedback')
      ) {
        feedbackPosts += 1
      }
    })

    const name = page.getByLabel('Full name')
    const email = page.getByLabel('Email address')
    const message = page.getByRole('textbox', {name: 'Message', exact: true})

    await name.fill('A')
    await email.fill('invalid')
    await page.getByLabel('Subject').fill('A')
    await message.fill('short')
    await page.getByRole('button', {name: 'Send message'}).click()

    expect(
      await name.evaluate(element =>
        (element as HTMLInputElement).checkValidity(),
      ),
    ).toBe(false)
    expect(
      await email.evaluate(element =>
        (element as HTMLInputElement).checkValidity(),
      ),
    ).toBe(false)
    expect(
      await message.evaluate(element =>
        (element as HTMLTextAreaElement).checkValidity(),
      ),
    ).toBe(false)
    expect(feedbackPosts).toBe(0)
  })

  test('submits valid feedback only to an intercepted same-origin endpoint', async ({
    page,
  }) => {
    let submittedBody: Record<string, unknown> | undefined

    await page.route('**/api/feedback', async route => {
      submittedBody = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        body: JSON.stringify({
          message: 'Your message has been received.',
          success: true,
        }),
        contentType: 'application/json',
        status: 202,
      })
    })

    await page.getByLabel('Full name').fill('Playwright Visitor')
    await page.getByLabel('Email address').fill('visitor@example.com')
    await page.getByLabel('Subject').fill('Gallery accessibility')
    await page
      .getByRole('textbox', {name: 'Message', exact: true})
      .fill('This deterministic browser test never sends a real email.')
    await page.getByRole('checkbox', {name: /privacy policy/i}).check()
    await page.getByRole('button', {name: 'Send message'}).click()

    await expect(
      page
        .getByRole('status')
        .filter({hasText: 'Your message has been received.'}),
    ).toBeVisible()
    expect(submittedBody).toEqual({
      email: 'visitor@example.com',
      locale: 'en',
      message: 'This deterministic browser test never sends a real email.',
      name: 'Playwright Visitor',
      privacyAccepted: true,
      subject: 'Gallery accessibility',
      website: '',
    })
  })
})

test.describe('newsletter validation', () => {
  test.beforeEach(async ({page}) => {
    await startWithOptionalConsentDenied(page)
    await page.goto('/en/store')
  })

  test('requires a valid email and explicit newsletter consent', async ({
    page,
  }) => {
    let newsletterPosts = 0

    page.on('request', request => {
      if (
        request.method() === 'POST' &&
        request.url().endsWith('/api/newsletter')
      ) {
        newsletterPosts += 1
      }
    })

    const email = page.getByRole('textbox', {name: 'Email address'})
    const submit = page.getByRole('button', {name: 'Subscribe'})

    await email.fill('invalid')
    await expect(submit).toBeDisabled()
    await page
      .getByRole('checkbox', {name: 'I agree to receive newsletter emails.'})
      .check()
    await submit.click()

    expect(
      await email.evaluate(element =>
        (element as HTMLInputElement).checkValidity(),
      ),
    ).toBe(false)
    expect(newsletterPosts).toBe(0)
  })

  test('submits a consented newsletter request without contacting email services', async ({
    page,
  }) => {
    let submittedBody: Record<string, unknown> | undefined

    await page.route('**/api/newsletter', async route => {
      submittedBody = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        body: JSON.stringify({
          message: 'Check your inbox to confirm your subscription.',
          success: true,
        }),
        contentType: 'application/json',
        status: 202,
      })
    })

    await page
      .getByRole('textbox', {name: 'Email address'})
      .fill('newsletter@example.com')
    await page
      .getByRole('checkbox', {name: 'I agree to receive newsletter emails.'})
      .check()
    await page.getByRole('button', {name: 'Subscribe'}).click()

    await expect(
      page.getByRole('status').filter({hasText: 'Successfully subscribed!'}),
    ).toBeVisible()
    expect(submittedBody).toEqual({
      consent: true,
      email: 'newsletter@example.com',
      locale: 'en',
      source: 'newsletter',
      website: '',
    })
  })
})
