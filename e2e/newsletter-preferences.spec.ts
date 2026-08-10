import {expect, test} from '@playwright/test'

const token = 'v1.initialization-vector.encrypted.authentication-tag'
const expectedAppOrigin =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'

test.describe('newsletter preference confirmation', () => {
  test.beforeEach(async ({context}) => {
    await context.clearCookies()
  })

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
    test(`opens the token-free ${scenario.action} confirmation page`, async ({
      page,
      request,
    }) => {
      const response = await request.get(
        `/api/newsletter/${scenario.endpoint}?token=${token}&locale=en`,
        {maxRedirects: 0},
      )
      const redirectLocation = response.headers().location

      if (!redirectLocation) throw new Error('Missing newsletter redirect')

      const location = new URL(redirectLocation)

      expect(response.status()).toBe(303)
      expect(location.origin).toBe(expectedAppOrigin)
      expect(`${location.pathname}${location.search}`).toBe(
        `/en/newsletter-preferences?action=${scenario.action}`,
      )

      const pageResponse = await page.goto(
        `${location.pathname}${location.search}`,
      )

      expect(pageResponse?.ok()).toBe(true)
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: 'Confirm newsletter preference',
        }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', {name: 'Confirm action'}),
      ).toBeVisible()
    })
  }
})
