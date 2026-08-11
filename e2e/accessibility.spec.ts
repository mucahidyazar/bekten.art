import {expect, test} from '@playwright/test'

import {scanForWcagAaViolations} from './helpers/accessibility'

const publicRoutes = [
  {name: 'home', path: '/'},
  {name: 'works', path: '/works'},
  {name: 'available works', path: '/available-works'},
  {name: 'collections', path: '/collections'},
  {name: 'exhibitions', path: '/exhibitions'},
  {name: 'journal', path: '/journal'},
  {name: 'press', path: '/press'},
  {name: 'archive', path: '/archive'},
  {name: 'contact', path: '/contact'},
] as const

test.describe('WCAG 2.1 AA public-page smoke', () => {
  for (const route of publicRoutes) {
    test(`${route.name} has no automatically detectable WCAG A/AA violations`, async ({
      page,
    }) => {
      await page.emulateMedia({reducedMotion: 'reduce'})
      const response = await page.goto(route.path, {
        waitUntil: 'domcontentloaded',
      })

      expect(response?.ok()).toBe(true)
      await expect(page.locator('main#main-content')).toBeVisible()

      const results = await scanForWcagAaViolations(page)

      expect(results.violations).toEqual([])
    })
  }
})
