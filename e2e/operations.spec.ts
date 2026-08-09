import {expect, test} from '@playwright/test'

import {startWithOptionalConsentDenied} from './helpers/consent'

test.describe('public operational endpoints', () => {
  test('reports process liveness without caching', async ({request}) => {
    const response = await request.get('/api/health')

    expect(response.status()).toBe(200)
    expect(response.headers()['cache-control']).toContain('no-store')
    await expect(response.json()).resolves.toEqual({status: 'ok'})
  })

  test('reports readiness with a status-consistent dependency contract', async ({
    request,
  }) => {
    const response = await request.get('/api/ready')
    const payload = (await response.json()) as {
      checks: Record<string, string>
      status: 'not_ready' | 'ready'
    }

    expect([200, 503]).toContain(response.status())
    expect(response.headers()['cache-control']).toContain('no-store')
    expect(Object.keys(payload.checks).sort()).toEqual([
      'configuration',
      'database',
      'email',
      'objectStorage',
    ])
    expect(response.status()).toBe(payload.status === 'ready' ? 200 : 503)
  })

  test('rejects an invalid media identifier before storage access', async ({
    request,
  }) => {
    const response = await request.get('/api/media/not-a-valid-media-id', {
      maxRedirects: 0,
    })

    expect(response.status()).toBe(404)
    await expect(response.json()).resolves.toEqual({error: 'Media not found'})
  })
})

test.describe('anonymous authorization boundary', () => {
  test('redirects an anonymous admin request to localized sign-in', async ({
    context,
    page,
  }) => {
    await context.clearCookies()
    await startWithOptionalConsentDenied(page)
    await page.goto('/tr/admin')

    await expect(page).toHaveURL(/\/tr\/sign-in(?:\?.*)?$/u)
    await expect(page.getByRole('heading', {name: /hoş geldiniz/i})).toBeVisible()
  })
})
