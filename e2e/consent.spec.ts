import {expect, test} from '@playwright/test'

import {CONSENT_STORAGE_KEY} from './helpers/consent'

import type {Page} from '@playwright/test'

const GTM_ROUTE = 'https://www.googletagmanager.com/**'

type ConsentDecision = {
  analytics: boolean
  externalMedia: boolean
  marketing: boolean
  savedAt: string
  version: number
}

function readConsent(page: Page) {
  return page.evaluate<ConsentDecision | null, string>(storageKey => {
    const raw = localStorage.getItem(storageKey)

    return raw ? (JSON.parse(raw) as ConsentDecision) : null
  }, CONSENT_STORAGE_KEY)
}

test.describe('consent mode and Google network gating', () => {
  test('defaults to denied and keeps GTM off until analytics opt-in', async ({
    page,
  }) => {
    const gtmRequests: string[] = []

    await page.route(GTM_ROUTE, async route => {
      gtmRequests.push(route.request().url())
      await route.fulfill({body: '', contentType: 'application/javascript'})
    })
    await page.goto('/')

    await expect
      .poll(() =>
        page.evaluate(() => {
          const entries = (window.dataLayer ?? []).map(entry =>
            Array.from(entry as ArrayLike<unknown>),
          )

          return entries.find(
            entry => entry[0] === 'consent' && entry[1] === 'default',
          )?.[2] as Record<string, string> | undefined
        }),
      )
      .toMatchObject({
        ad_personalization: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        analytics_storage: 'denied',
      })
    await expect(page.locator('script#google-tag-manager')).toHaveCount(0)
    expect(gtmRequests).toEqual([])

    await page.getByRole('button', {name: 'Accept all'}).click()

    await expect
      .poll(() => readConsent(page))
      .toMatchObject({
        analytics: true,
        externalMedia: true,
        marketing: true,
        version: 1,
      })
    await expect(page.locator('script#google-tag-manager')).toHaveCount(1)
    await expect.poll(() => gtmRequests.length).toBe(1)
  })

  test('persists equal rejection and keeps Google requests blocked on reload', async ({
    page,
  }) => {
    const googleRequests: string[] = []

    page.on('request', request => {
      if (
        /(?:googletagmanager|google-analytics|doubleclick)\.com/iu.test(
          request.url(),
        )
      ) {
        googleRequests.push(request.url())
      }
    })

    await page.goto('/')
    await page.getByRole('button', {name: 'Reject optional'}).click()

    await expect
      .poll(() => readConsent(page))
      .toMatchObject({
        analytics: false,
        externalMedia: false,
        marketing: false,
        version: 1,
      })

    await page.reload()

    await expect(page.locator('script#google-tag-manager')).toHaveCount(0)
    expect(googleRequests).toEqual([])
  })

  test('lets a visitor revoke previously accepted optional consent', async ({
    page,
  }) => {
    await page.route(GTM_ROUTE, async route => {
      await route.fulfill({body: '', contentType: 'application/javascript'})
    })
    await page.goto('/')
    await page.getByRole('button', {name: 'Accept all'}).click()
    await page.getByRole('button', {name: 'Open privacy preferences'}).click()

    await page.getByRole('checkbox', {name: 'Analytics'}).uncheck()
    await page.getByRole('checkbox', {name: 'Marketing'}).uncheck()
    await page.getByRole('checkbox', {name: 'External media'}).uncheck()
    await page.getByRole('button', {name: 'Save preferences'}).click()

    await expect
      .poll(() => readConsent(page))
      .toMatchObject({
        analytics: false,
        externalMedia: false,
        marketing: false,
        version: 1,
      })

    const latestConsentUpdate = await page.evaluate(() => {
      const updates = (window.dataLayer ?? [])
        .map(entry => Array.from(entry as ArrayLike<unknown>))
        .filter(entry => entry[0] === 'consent' && entry[1] === 'update')

      return updates.at(-1)?.[2] as Record<string, string> | undefined
    })

    expect(latestConsentUpdate).toMatchObject({
      ad_personalization: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      analytics_storage: 'denied',
    })
  })
})
