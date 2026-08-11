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
    expect(css).toContain('.heritage-framed-artwork')
    expect(css).toContain('.heritage-illustrated-band')
    expect(css).toContain('.heritage-reference-footer')
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
