import 'dotenv/config'

import {randomUUID} from 'node:crypto'

import {expect, test} from '@playwright/test'

import {prisma} from '../src/lib/db'

const sessionToken = `e2e-${randomUUID()}`
const studioEmail = 'e2e-owner@example.test'
const dashboardBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

test.beforeAll(async () => {
  const editor = await prisma.user.create({
    data: {
      acceptedAt: new Date(),
      email: studioEmail,
      emailVerified: new Date(),
      name: 'E2E Studio Owner',
      role: 'OWNER',
      studioStatus: 'ACTIVE',
    },
    select: {id: true},
  })

  await prisma.session.create({
    data: {
      expires: new Date(Date.now() + 30 * 60 * 1000),
      sessionToken,
      userId: editor.id,
    },
  })
})

test.afterAll(async () => {
  await prisma.user.deleteMany({where: {email: studioEmail}})
})

test.beforeEach(async ({context}) => {
  await context.addCookies([
    {
      httpOnly: true,
      name: 'next-auth.session-token',
      sameSite: 'Lax',
      url: dashboardBaseUrl,
      value: sessionToken,
    },
    {
      httpOnly: true,
      name: '__Secure-next-auth.session-token',
      sameSite: 'Lax',
      secure: true,
      url: dashboardBaseUrl.replace(/^http:/u, 'https:'),
      value: sessionToken,
    },
  ])
})

test('gives an editor a responsive shadcn workspace and language hub', async ({
  isMobile,
  page,
}) => {
  const response = await page.goto('/dashboard')

  expect(response?.ok()).toBe(true)
  await expect(page.locator('#consent-mode-bootstrap')).toHaveCount(0)
  expect(
    await page.evaluate(
      () =>
        typeof window.dataLayer === 'undefined' &&
        typeof window.gtag === 'undefined',
    ),
  ).toBe(true)
  await expect(page.getByTestId('studio-shell')).toHaveAttribute(
    'data-shadcn-shell',
    'true',
  )
  await expect(
    page.getByRole('heading', {level: 1, name: 'Editorial overview'}),
  ).toBeVisible()

  const navigation = page.getByRole('navigation', {name: 'Studio'})

  if (isMobile) {
    await expect(navigation).not.toBeVisible()
    await page.getByTestId('studio-mobile-trigger').click()

    await expect(
      page.getByRole('button', {name: 'Close Studio navigation'}),
    ).toHaveAttribute('aria-expanded', 'true')
    await expect(
      page.getByRole('dialog', {name: 'Studio navigation'}),
    ).toBeVisible()
  }

  await expect(navigation).toBeVisible()
  await navigation.getByRole('link', {name: 'Languages'}).click()
  await expect(page).toHaveURL(/\/dashboard\/languages\/?$/u)
  await expect(
    page.getByRole('heading', {level: 1, name: 'Interface translations'}),
  ).toBeVisible()
  await expect(page.getByRole('heading', {name: 'English'})).toBeVisible()
  await expect(page.getByRole('heading', {name: 'Türkçe'})).toBeVisible()
  await expect(page.getByRole('heading', {name: 'Русский'})).toBeVisible()
  await expect(page.getByRole('heading', {name: 'Кыргызча'})).toBeVisible()
  await expect(
    page.getByRole('region', {name: 'Registered languages'}),
  ).toBeVisible()
  await expect(page.getByRole('button', {name: 'Add language'})).toBeVisible()

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
