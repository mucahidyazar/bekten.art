import {expect, test} from '@playwright/test'

import {startWithOptionalConsentDenied} from './helpers/consent'

test.describe('anonymous auth client validation', () => {
  test.beforeEach(async ({page}) => {
    await startWithOptionalConsentDenied(page)
  })

  test('blocks malformed sign-in data before a credentials request', async ({
    page,
  }) => {
    let credentialsPosts = 0

    page.on('request', request => {
      if (
        request.method() === 'POST' &&
        request.url().includes('/api/auth/callback/credentials')
      ) {
        credentialsPosts += 1
      }
    })

    await page.goto('/en/sign-in')
    await page.getByLabel('Email Address').fill('not-an-email')
    await page.getByLabel('Password', {exact: true}).fill('short')
    await page.getByRole('button', {name: 'Sign In', exact: true}).click()

    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
    await expect(
      page.getByText('Password must be at least 8 characters'),
    ).toBeVisible()
    expect(credentialsPosts).toBe(0)
  })

  test('blocks an invalid registration before creating an account', async ({
    page,
  }) => {
    let registrationPosts = 0

    page.on('request', request => {
      if (
        request.method() === 'POST' &&
        request.url().endsWith('/api/auth/register')
      ) {
        registrationPosts += 1
      }
    })

    await page.goto('/en/sign-up')
    await page.getByLabel('Full Name').fill('A')
    await page.getByLabel('Email Address').fill('invalid')
    await page.getByLabel('Password', {exact: true}).fill('long-enough')
    await page.getByLabel('Confirm Password').fill('different-value')
    await page.getByRole('button', {name: 'Create Account'}).click()

    await expect(page.getByText('Name must be at least 2 characters')).toBeVisible()
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
    await expect(page.getByText("Passwords don't match")).toBeVisible()
    expect(registrationPosts).toBe(0)
  })
})
