import {readFile} from 'node:fs/promises'
import {resolve} from 'node:path'

import {describe, expect, it} from 'vitest'

describe('editorial heritage style contract', () => {
  it('defines the approved paper, ink, rust and restrained gold system', async () => {
    const css = await readFile(
      resolve(process.cwd(), 'src/app/[locale]/global.css'),
      'utf8',
    )

    expect(css).toContain('--heritage-paper: #eee6d5')
    expect(css).toContain('--heritage-ink: #211e18')
    expect(css).toContain('--heritage-rust: #9b3f24')
    expect(css).toContain('--heritage-gold: #9a7b42')
    expect(css).toContain('--heritage-muted: #625c50')
    expect(css).toContain('.heritage-paper-grain')
    expect(css).toContain('.heritage-artwork-frame')
    expect(css).toContain('.heritage-illustrated-band')
    expect(css).toContain('.heritage-reference-footer')
    expect(css).toMatch(/\.heritage-header\s*\{[^}]*background:\s*transparent/u)
    expect(css).not.toMatch(/\.heritage-header\s*\{[^}]*border-bottom:/u)
  })

  it('lets the header and every first hero reveal one continuous page paper', async () => {
    const [globalCss, catalogCss, managedCss] = await Promise.all([
      readFile(resolve(process.cwd(), 'src/app/[locale]/global.css'), 'utf8'),
      readFile(
        resolve(
          process.cwd(),
          'src/components/public-site/catalog-layouts.module.css',
        ),
        'utf8',
      ),
      readFile(
        resolve(
          process.cwd(),
          'src/components/public-site/public-managed-pages.module.css',
        ),
        'utf8',
      ),
    ])

    expect(globalCss).toMatch(
      /\.heritage-home-hero\s*\{[^}]*background:\s*transparent/u,
    )
    expect(catalogCss).toMatch(/\.page\s*\{[^}]*background:\s*transparent/u)
    expect(catalogCss).toMatch(
      /\.pageIntro\s*\{[^}]*background:\s*transparent/u,
    )
    expect(managedCss).toMatch(/\.page\s*\{[^}]*background:\s*transparent/u)
    expect(managedCss).toMatch(/\.hero\s*\{[^}]*background:\s*transparent/u)
  })

  it('keeps visible keyboard focus and a reduced-motion fallback', async () => {
    const css = await readFile(
      resolve(process.cwd(), 'src/app/[locale]/global.css'),
      'utf8',
    )

    expect(css).toMatch(/:focus-visible[\s\S]*outline:/u)
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toMatch(/scroll-behavior:\s*auto/u)
  })
})
