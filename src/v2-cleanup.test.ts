import {existsSync, readFileSync, readdirSync} from 'node:fs'
import {join} from 'node:path'

import {describe, expect, it} from 'vitest'

const root = process.cwd()

function source(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function* filesUnder(relativeDirectory: string): Generator<string> {
  for (const entry of readdirSync(join(root, relativeDirectory), {
    withFileTypes: true,
  })) {
    const relativePath = join(relativeDirectory, entry.name)

    if (entry.isDirectory()) {
      yield* filesUnder(relativePath)
    } else if (entry.isFile()) {
      yield relativePath
    }
  }
}

describe('V2 cleanup contract', () => {
  const removedRuntimePaths = [
    'src/app/[locale]/(root)/(auth)',
    'src/app/[locale]/(root)/auth',
    'src/app/[locale]/(root)/confirm-email-action',
    'src/app/[locale]/(root)/profile',
    'src/app/[locale]/(root)/store',
    'src/app/[locale]/(root)/admin',
    'src/app/api/auth/admin-check',
    'src/app/api/auth/forgot-password',
    'src/app/api/auth/register',
    'src/app/api/auth/reset-password',
    'src/app/api/auth/verify-email',
    'src/app/api/admin',
    'src/app/api/cms/contact-info',
    'src/app/auth',
    'src/components/admin',
    'src/components/forms/password-reset-forms.tsx',
    'src/components/forms/sign-in-form.tsx',
    'src/components/forms/sign-up-form.tsx',
    'src/components/molecules/auth-section.tsx',
    'src/components/molecules/sign-out-button.tsx',
    'src/components/organisms/profile-form.tsx',
    'src/components/providers/user-provider.tsx',
    'src/components/sections/home-store-section.tsx',
    'src/components/sections/store-section.tsx',
    'src/common.ts',
    'src/server/admin',
  ] as const

  it.each(removedRuntimePaths)('removes %s from the runtime tree', path => {
    expect(existsSync(join(root, path))).toBe(false)
  })

  it('keeps the public locale layout account and music-provider free', () => {
    const layout = source('src/app/[locale]/layout.tsx')

    expect(layout).not.toMatch(/getUiUser|UserProvider|MusicProvider/)
  })

  it('keeps the public root layout independent from user and admin shells', () => {
    const layout = source('src/app/[locale]/(root)/layout.tsx')

    expect(layout).not.toMatch(/getUiUser|LayoutWrapper|\buser\b/)
  })

  it('publishes no store or admin destination from public navigation', () => {
    const navigation = source('src/components/navbar.tsx')

    expect(navigation).not.toMatch(/['"]\/(?:store|admin)(?:['"/])/)
    expect(navigation).not.toMatch(/isAdmin|user=/)
  })

  it('publishes no store route in the sitemap', () => {
    expect(source('src/app/sitemap.ts')).not.toContain("path: '/store'")
  })

  it('removes retired store backfill and social-card contracts', () => {
    expect(source('src/app/api/og/route.tsx')).not.toMatch(/case ['"]store['"]/)
    expect(source('package.json')).not.toContain('content:backfill')
    expect(
      existsSync(join(root, 'scripts/lib/legacy-content-backfill.mjs')),
    ).toBe(false)
    expect(
      existsSync(join(root, 'src/server/content/legacy-backfill.test.ts')),
    ).toBe(false)
  })

  it('does not require retired public Google OAuth configuration at startup', () => {
    expect(source('scripts/lib/production-startup.mjs')).not.toMatch(
      /AUTH_GOOGLE_(?:ID|SECRET)/,
    )
  })

  it('never reuses an unknown local server for production E2E', () => {
    const playwrightConfig = source('playwright.config.ts')

    expect(playwrightConfig).toContain('reuseExistingServer: false')
    expect(playwrightConfig).toContain('PLAYWRIGHT_START_LOCAL_SERVER')
  })

  it.each(['en', 'tr', 'ru', 'kg'])(
    'keeps only newsletter copy in the legacy forms namespace for %s',
    locale => {
      const catalog = JSON.parse(
        source(`public/locales/${locale}/common.json`),
      ) as {
        forms: {
          buttons: Record<string, string>
          messages: Record<string, string>
        }
      }

      expect(Object.keys(catalog.forms)).toEqual(['buttons', 'messages'])
      expect(Object.keys(catalog.forms.buttons).sort()).toEqual([
        'subscribe',
        'subscribing',
      ])
      expect(Object.keys(catalog.forms.messages).sort()).toEqual([
        'noSpam',
        'subscribeDescription',
        'subscribeSuccess',
        'unsubscribeAnytime',
        'weeklyUpdates',
      ])
    },
  )

  it('removes the temporary backup and every backup-specific config exception', () => {
    expect(existsSync(join(root, 'backup'))).toBe(false)
    expect(source('tsconfig.json')).not.toMatch(/"backup"/)
    expect(source('eslint.config.mjs')).not.toMatch(/backup\/\*\*/)
    expect(source('vitest.config.mts')).not.toMatch(/backup\/\*\*/)

    const runtimeFiles = ['src', 'e2e', 'scripts', 'prisma']
      .flatMap(directory => [...filesUnder(directory)])
      .filter(path => path !== 'src/v2-cleanup.test.ts')

    for (const runtimeFile of runtimeFiles) {
      expect(source(runtimeFile)).not.toMatch(
        /from ['"].*backup|import\(['"].*backup/,
      )
    }
  })
})
