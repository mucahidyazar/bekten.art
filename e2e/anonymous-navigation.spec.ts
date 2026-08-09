import {expect, test} from '@playwright/test'

import {startWithOptionalConsentDenied} from './helpers/consent'

const supportedLocales = ['en', 'tr', 'ru', 'ky'] as const

test.describe('anonymous locale and navigation smoke', () => {
  test('redirects the root and legacy locale to canonical localized URLs', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/en\/?$/u)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    await page.goto('/kg/news')

    await expect(page).toHaveURL(/\/ky\/news\/?$/u)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ky')
  })

  for (const locale of supportedLocales) {
    test(`renders the ${locale} home route with the matching document language`, async ({
      page,
    }) => {
      const response = await page.goto(`/${locale}`)

      expect(response?.ok()).toBe(true)
      await expect(page.locator('html')).toHaveAttribute('lang', locale)
      await expect(page.locator('main#main-content')).toBeVisible()
      await expect(page.locator('h1')).toHaveCount(1)
    })
  }

  test('preserves the selected locale through primary navigation', async ({
    page,
  }) => {
    await startWithOptionalConsentDenied(page)
    await page.goto('/en')
    await page
      .getByRole('button', {name: /change language/i})
      .click()
    await page.getByRole('menuitem', {name: 'Turkish'}).click()

    await expect(page).toHaveURL(/\/tr\/?$/u)
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr')

    await page.getByRole('link', {name: 'Haberler', exact: true}).click()

    await expect(page).toHaveURL(/\/tr\/news\/?$/u)
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr')
  })

  test('exposes a working keyboard skip link', async ({page}) => {
    await startWithOptionalConsentDenied(page)
    await page.goto('/en')
    await page.keyboard.press('Tab')

    const skipLink = page.getByRole('link', {name: 'Skip to main content'})

    await expect(skipLink).toBeFocused()
    await skipLink.press('Enter')
    await expect(page.locator('main#main-content')).toBeFocused()
  })
})
