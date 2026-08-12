import {expect, test} from '@playwright/test'

import {startWithOptionalConsentDenied} from './helpers/consent'

const supportedLocales = [
  {locale: 'en', path: '/'},
  {locale: 'tr', path: '/tr'},
  {locale: 'ru', path: '/ru'},
  {locale: 'ky', path: '/ky'},
] as const

const collectionLocales = [
  {path: '/collections', title: 'Memory, land & home'},
  {path: '/tr/collections', title: 'Hafıza, toprak ve yurt'},
  {path: '/ru/collections', title: 'Память, земля и дом'},
  {path: '/ky/collections', title: 'Эстутум, жер жана үй'},
] as const

test.describe('V2 editorial shell and navigation', () => {
  test('keeps every localized Collections title within two stable lines', async ({
    page,
  }) => {
    for (const locale of collectionLocales) {
      await page.goto(locale.path)

      const title = page.getByRole('heading', {
        level: 1,
        name: locale.title,
      })
      const metrics = await title.evaluate(element => {
        const style = getComputedStyle(element)
        const lineHeight = Number.parseFloat(style.lineHeight)

        return {
          lines: Math.round(
            element.getBoundingClientRect().height / lineHeight,
          ),
          titleDensity: element.getAttribute('data-title-density'),
        }
      })

      expect(metrics.titleDensity).toBe('compact')
      expect(metrics.lines).toBeLessThanOrEqual(2)
    }
  })

  test('runs a native transition while preserving public chrome', async ({
    page,
  }) => {
    await page.goto('/works')

    const supported = await page.evaluate(
      () => typeof document.startViewTransition === 'function',
    )

    test.skip(!supported, 'View Transition API is unavailable in this browser')

    const animationFrames = await page.evaluate(async () => {
      const transition = document.startViewTransition(() => {
        document.body.dataset.viewTransitionProbe = 'ready'
      })
      const frames: string[][] = []

      for (let index = 0; index < 6; index += 1) {
        frames.push(
          document.getAnimations().map(animation => {
            const browserAnimation = animation as Animation & {
              animationName?: string
              pseudoElement?: string
            }

            return (
              browserAnimation.pseudoElement ??
              browserAnimation.animationName ??
              'unclassified-animation'
            )
          }),
        )
        await new Promise(resolve =>
          requestAnimationFrame(() => resolve(undefined)),
        )
      }

      await transition.finished

      return frames
    })

    expect(
      animationFrames.some(frame =>
        frame.some(name => name.includes('view-transition')),
      ),
    ).toBe(true)

    await page.evaluate(() => {
      const original = document.startViewTransition.bind(document)
      const trackedWindow = window as Window & {
        __routeViewTransitionCalls?: number
        __routeViewTransitionFrames?: string[][]
      }

      trackedWindow.__routeViewTransitionCalls = 0
      trackedWindow.__routeViewTransitionFrames = []
      document.startViewTransition = ((
        ...arguments_: Parameters<Document['startViewTransition']>
      ) => {
        trackedWindow.__routeViewTransitionCalls =
          (trackedWindow.__routeViewTransitionCalls ?? 0) + 1
        const transition = original(...arguments_)

        void (async () => {
          for (let index = 0; index < 6; index += 1) {
            await new Promise(resolve =>
              requestAnimationFrame(() => resolve(undefined)),
            )
            trackedWindow.__routeViewTransitionFrames?.push(
              document.getAnimations().map(animation => {
                const browserAnimation = animation as Animation & {
                  animationName?: string
                  pseudoElement?: string
                }

                return (
                  browserAnimation.pseudoElement ??
                  browserAnimation.animationName ??
                  'unclassified-animation'
                )
              }),
            )
          }
        })()

        return transition
      }) as Document['startViewTransition']
    })

    const firstWork = page.locator('main a[href^="/works/"]').first()

    await firstWork.click()
    await expect(page).toHaveURL(/\/works\/[a-z0-9-]+\/?$/u)
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as Window & {__routeViewTransitionCalls?: number})
              .__routeViewTransitionCalls ?? 0,
        ),
      )
      .toBeGreaterThan(0)
    await expect
      .poll(() =>
        page.evaluate(() =>
          (
            window as Window & {__routeViewTransitionFrames?: string[][]}
          ).__routeViewTransitionFrames?.some(frame =>
            frame.some(name => name.includes('view-transition')),
          ),
        ),
      )
      .toBe(true)
    await expect(
      page.getByTestId('heritage-frame-overlay').first(),
    ).toBeVisible()
    await expect(page.getByTestId('heritage-header')).toBeVisible()
    expect(
      await page
        .getByTestId('heritage-header')
        .evaluate(element => getComputedStyle(element).viewTransitionName),
    ).toBe('persistent-header')
  })

  test('serves prefixless English and normalizes legacy locale URLs', async ({
    page,
    request,
  }) => {
    const englishHome = await request.get('/', {maxRedirects: 0})
    const legacyLocaleRedirect = await request.get('/kg/news', {
      maxRedirects: 0,
    })

    expect(englishHome.status()).toBe(200)
    expect(englishHome.headers().location).toBeUndefined()
    expect(legacyLocaleRedirect.status()).toBe(308)
    expect(legacyLocaleRedirect.headers().location).toBe('/ky/news')

    await page.goto('/kg/news')

    await expect(page).toHaveURL(/\/ky\/journal\/?$/u)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ky')
  })

  test('keeps the default-locale rewrite internal without trusting forwarded hosts', async ({
    request,
  }) => {
    const response = await request.get('/works?view=grid', {
      headers: {
        host: 'evil.invalid',
        'x-forwarded-host': 'evil.invalid',
        'x-forwarded-proto': 'http',
      },
      maxRedirects: 0,
    })

    expect(response.status()).toBe(200)
    expect(response.headers().link).toBeUndefined()
    expect(response.headers().location).toBeUndefined()
    expect(await response.text()).not.toContain('evil.invalid')
  })

  for (const redirect of [
    {from: '/en', to: '/'},
    {from: '/en/works?view=grid', to: '/works?view=grid'},
  ] as const) {
    test(`permanently removes the default-locale prefix from ${redirect.from}`, async ({
      request,
    }) => {
      const response = await request.get(redirect.from, {maxRedirects: 0})

      expect(response.status()).toBe(308)
      expect(response.headers().location).toBe(redirect.to)
    })
  }

  test('ignores a forged pathname marker on a prefixed English URL', async ({
    request,
  }) => {
    const response = await request.get('/en/works', {
      headers: {'x-pathname': '/works'},
      maxRedirects: 0,
    })

    expect(response.status()).toBe(308)
    expect(response.headers().location).toBe('/works')
  })

  for (const redirect of [
    {from: '/news', to: '/journal'},
    {from: '/en/news', to: '/journal'},
    {from: '/en/news/studio-note', to: '/journal/studio-note'},
    {from: '/ru/gallery', to: '/ru/works'},
    {from: '/artist', to: '/about'},
    {from: '/ky/artist', to: '/ky/about'},
  ] as const) {
    test(`permanently redirects ${redirect.from} to ${redirect.to}`, async ({
      request,
    }) => {
      const response = await request.get(redirect.from, {maxRedirects: 0})

      expect(response.status()).toBe(308)
      expect(response.headers().location).toBe(redirect.to)
    })
  }

  test('renders every managed public route while keeping the CMS on dashboard', async ({
    page,
  }) => {
    for (const route of [
      {heading: 'The artist', path: '/about'},
      {heading: 'For collectors', path: '/collectors'},
      {heading: 'The studio', path: '/studio'},
    ] as const) {
      const response = await page.goto(route.path)

      expect(response?.ok()).toBe(true)
      await expect(
        page.getByRole('heading', {level: 1, name: route.heading}),
      ).toBeVisible()
      await expect(page.getByTestId('heritage-header')).toBeVisible()
    }

    const response = await page.goto('/dashboard/sign-in')

    expect(response?.ok()).toBe(true)
    await expect(
      page.getByRole('heading', {level: 1, name: 'Private editorial access'}),
    ).toBeVisible()
    await expect(page.getByTestId('heritage-header')).toHaveCount(0)
  })

  for (const {locale, path} of supportedLocales) {
    test(`renders the ${locale} home route with the matching document language`, async ({
      page,
    }) => {
      const response = await page.goto(path)

      expect(response?.ok()).toBe(true)
      await expect(page.locator('html')).toHaveAttribute('lang', locale)
      await expect(page.locator('main#main-content')).toBeVisible()
      await expect(page.locator('h1')).toHaveCount(1)
    })
  }

  test('preserves the selected locale on a public catalogue route', async ({
    page,
  }) => {
    await startWithOptionalConsentDenied(page)
    await page.goto('/works')

    const languages = page.getByRole('navigation', {name: 'Languages'})

    const englishLocale = languages.getByRole('link', {name: 'English'})

    await expect(englishLocale).toHaveAttribute('aria-current', 'page')
    await expect(englishLocale).toHaveAttribute('href', '/works')
    await languages.getByRole('link', {name: 'Türkçe'}).click()

    await expect(page).toHaveURL(/\/tr\/works\/?$/u)
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr')
    await expect(
      page.getByRole('heading', {level: 1, name: 'Eserler'}),
    ).toBeVisible()

    const prefixlessEnglishLocale = page
      .getByRole('navigation', {name: 'Diller'})
      .getByRole('link', {name: 'English'})

    await expect(prefixlessEnglishLocale).toHaveAttribute('href', '/works')
    await prefixlessEnglishLocale.click()

    await expect(page).toHaveURL(/\/works\/?$/u)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(
      page.getByRole('heading', {level: 1, name: 'Works'}),
    ).toBeVisible()
  })

  test('exposes the editorial navigation without V1 account or store controls', async ({
    isMobile,
    page,
  }) => {
    await startWithOptionalConsentDenied(page)
    await page.goto('/')

    const header = page.getByTestId('heritage-header')

    await expect(header).toBeVisible()
    await expect(header.locator('img[src="/svg/full-logo.svg"]')).toBeVisible()
    await expect(
      header.locator('a:has(img[src="/svg/full-logo.svg"])'),
    ).toHaveAttribute('href', '/')
    await expect(header).not.toContainText(
      /account|cart|profile|sign in|store/iu,
    )

    if (isMobile) {
      const mobileMenu = header.locator('details.heritage-mobile-menu')
      const menuButton = mobileMenu.locator('summary')

      await menuButton.focus()
      await expect(menuButton).toBeFocused()
      await menuButton.press('Enter')
      await expect(mobileMenu).toHaveAttribute('open', '')
      const journalLink = mobileMenu.getByRole('link', {name: 'Journal'})

      await expect(journalLink).toHaveAttribute('href', '/journal')
      await journalLink.click()

      await expect(page).toHaveURL(/\/journal\/?$/u)
      await expect(
        page.getByRole('heading', {level: 1, name: 'Journal'}),
      ).toBeVisible()
    } else {
      const primaryNavigation = header.getByRole('navigation', {
        name: 'Primary navigation',
      })
      const collectionsLink = primaryNavigation.getByRole('link', {
        name: 'Collections',
      })

      await expect(primaryNavigation).toBeVisible()
      await expect(collectionsLink).toHaveAttribute('href', '/collections')
      await collectionsLink.click()

      await expect(page).toHaveURL(/\/collections\/?$/u)
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: 'Memory, land & home',
        }),
      ).toBeVisible()
    }
  })

  test('exposes a working keyboard skip link', async ({page}) => {
    await startWithOptionalConsentDenied(page)
    await page.goto('/')
    await page.keyboard.press('Tab')

    const skipLink = page.getByRole('link', {name: 'Skip to main content'})

    await expect(skipLink).toBeFocused()
    await skipLink.press('Enter')
    await expect(page.locator('main#main-content')).toBeFocused()
  })

  test('keeps retired public account and store routes unavailable', async ({
    page,
  }) => {
    const retiredRoutes = [
      '/store',
      '/sign-in',
      '/sign-up',
      '/forgot-password',
      '/reset-password',
      '/profile/visitor',
    ]

    for (const route of retiredRoutes) {
      const response = await page.goto(route)

      expect(response?.status()).toBe(404)
      await expect(page).toHaveURL(new RegExp(`${route}/?$`, 'u'))
      await expect(page.getByRole('heading', {name: '404'})).toBeVisible()
      await expect(page.getByTestId('heritage-header')).toBeVisible()
    }
  })
})
