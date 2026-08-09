import type {Page} from '@playwright/test'

export const CONSENT_STORAGE_KEY = 'bekten.consent.v1'

export async function startWithOptionalConsentDenied(page: Page) {
  await page.addInitScript(storageKey => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        analytics: false,
        externalMedia: false,
        marketing: false,
        savedAt: new Date().toISOString(),
        version: 1,
      }),
    )
  }, CONSENT_STORAGE_KEY)
}
