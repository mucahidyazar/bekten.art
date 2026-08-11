import {expect, test} from '@playwright/test'

import {startWithOptionalConsentDenied} from './helpers/consent'

const publicCatalogRoutes = [
  {heading: 'Works', path: '/works'},
  {heading: 'Available works', path: '/available-works'},
  {heading: 'Memory, land & home', path: '/collections'},
  {heading: 'Exhibitions', path: '/exhibitions'},
  {heading: 'Journal', path: '/journal'},
  {heading: 'Press', path: '/press'},
] as const

test.describe('V2 public catalogue list routes', () => {
  test.beforeEach(async ({page}) => {
    await startWithOptionalConsentDenied(page)
  })

  for (const route of publicCatalogRoutes) {
    test(`${route.heading} exposes a localized editorial list without commerce UI`, async ({
      page,
    }) => {
      const response = await page.goto(route.path, {
        waitUntil: 'domcontentloaded',
      })
      const main = page.locator('main#main-content')

      expect(response?.ok()).toBe(true)
      await expect(main).toBeVisible()
      await expect(
        main.getByRole('heading', {level: 1, name: route.heading}),
      ).toBeVisible()
      await expect(main.getByRole('heading', {level: 1})).toHaveCount(1)
      await expect(
        main.getByRole('button', {name: /add to cart|buy now|checkout/iu}),
      ).toHaveCount(0)
      await expect(
        main.locator(
          [
            'a[href*="/cart"]',
            'a[href*="/checkout"]',
            'a[href*="/store"]',
            'form[action*="/checkout"]',
            '[data-testid*="cart"]',
          ].join(', '),
        ),
      ).toHaveCount(0)
    })
  }

  test('renders seeded editorial content instead of empty-state shells', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.locator('main a[href^="/works/"]')).not.toHaveCount(0)

    await page.goto('/works')
    await expect(page.locator('main a[href^="/works/"]')).not.toHaveCount(0)

    await page.goto('/collections')
    await expect(page.locator('main a[href^="/collections/"]')).not.toHaveCount(
      0,
    )
  })
})
