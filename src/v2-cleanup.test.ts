import {existsSync, readFileSync} from 'node:fs'
import {join} from 'node:path'

const root = process.cwd()

function source(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8')
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

  it('records the temporary backup without allowing runtime imports', () => {
    const manifestPath = join(root, 'backup/manifest.md')

    expect(existsSync(manifestPath)).toBe(true)
    expect(source('tsconfig.json')).toMatch(/"backup"/)
    expect(source('eslint.config.mjs')).toMatch(/backup\/\*\*/)
    expect(source('vitest.config.mts')).toMatch(/backup\/\*\*/)

    const runtimeFiles = [
      'src/app/[locale]/layout.tsx',
      'src/app/[locale]/(root)/layout.tsx',
      'src/app/[locale]/(root)/page.tsx',
      'src/components/navbar.tsx',
    ]

    for (const runtimeFile of runtimeFiles) {
      expect(source(runtimeFile)).not.toMatch(/from ['"].*backup|import\(['"].*backup/)
    }
  })
})
