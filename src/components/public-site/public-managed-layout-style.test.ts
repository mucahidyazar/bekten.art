import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'

import {describe, expect, it} from 'vitest'

const styles = readFileSync(
  resolve(
    process.cwd(),
    'src/components/public-site/public-managed-pages.module.css',
  ),
  'utf8',
)

describe('managed page responsive layout contract', () => {
  it('centers both direct and nested process headings', () => {
    expect(styles).toMatch(
      /\.processSection\s*>\s*\.shell\s*>\s*\.sectionHeading/u,
    )
  })

  it('clears the fifth commission divider when it starts a tablet row', () => {
    expect(styles).toMatch(
      /\.commissionSteps\s+li:nth-child\(5\)[^{]*\{[^}]*border-left:\s*0/isu,
    )
  })
})
