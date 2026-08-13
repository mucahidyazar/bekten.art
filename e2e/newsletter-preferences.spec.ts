import {expect, test} from '@playwright/test'

const token = 'v1.initialization-vector.encrypted.authentication-tag'
const expectedAppOrigin =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const localeContracts = [
  {
    locale: 'en',
    pathnamePrefix: '',
    submit: 'Confirm action',
    title: 'Confirm newsletter preference',
  },
  {
    locale: 'tr',
    pathnamePrefix: '/tr',
    submit: 'İşlemi onayla',
    title: 'Bülten tercihini onaylayın',
  },
] as const

test.describe('newsletter preference confirmation', () => {
  test.beforeEach(async ({context}) => {
    await context.clearCookies()
  })

  for (const locale of localeContracts) {
    for (const scenario of [
      {
        action: 'newsletter-confirm',
        endpoint: 'confirm',
      },
      {
        action: 'newsletter-unsubscribe',
        endpoint: 'unsubscribe',
      },
    ] as const) {
      test(`opens the token-free ${locale.locale} ${scenario.action} confirmation page`, async ({
        page,
        request,
      }) => {
        const response = await request.get(
          `/api/newsletter/${scenario.endpoint}?token=${token}&locale=${locale.locale}`,
          {maxRedirects: 0},
        )
        const redirectLocation = response.headers().location

        if (!redirectLocation) throw new Error('Missing newsletter redirect')

        const location = new URL(redirectLocation)

        expect(response.status()).toBe(303)
        expect(location.origin).toBe(expectedAppOrigin)
        expect(`${location.pathname}${location.search}`).toBe(
          `${locale.pathnamePrefix}/newsletter-preferences?action=${scenario.action}`,
        )

        const pageResponse = await page.goto(
          `${location.pathname}${location.search}`,
        )

        expect(pageResponse?.ok()).toBe(true)
        await expect(
          page.getByRole('heading', {level: 1, name: locale.title}),
        ).toBeVisible()
        await expect(
          page.getByRole('button', {name: locale.submit}),
        ).toBeVisible()
      })
    }
  }
})
