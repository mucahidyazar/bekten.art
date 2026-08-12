import {readFileSync} from 'node:fs'
import {join} from 'node:path'

import {describe, expect, it} from 'vitest'

const root = process.cwd()

function source(path: string) {
  return readFileSync(join(root, path), 'utf8')
}

describe('end-to-end native View Transition contract', () => {
  it('uses the config-free Next.js 16 integration and removes the legacy provider', () => {
    expect(source('next.config.js')).not.toMatch(/viewTransition\s*:/u)
    expect(source('src/app/[locale]/layout.tsx')).not.toMatch(
      /next-view-transitions|<ViewTransitions>/u,
    )
    expect(source('src/app/[locale]/layout.tsx')).toContain(
      'data-scroll-behavior="smooth"',
    )

    const packageJson = JSON.parse(source('package.json')) as {
      dependencies?: Record<string, string>
    }

    expect(packageJson.dependencies).not.toHaveProperty('next-view-transitions')
  })

  it('ships the complete animation, persistent-shell and reduced-motion CSS', () => {
    const css = source('src/app/[locale]/global.css')

    for (const selector of [
      '::view-transition-old(.fade-out)',
      '::view-transition-new(.slide-up)',
      '::view-transition-old(.nav-forward)',
      '::view-transition-new(.nav-back)',
      '::view-transition-group(.morph)',
      '::view-transition-group(.text-morph)',
      '::view-transition-group(persistent-header)',
      '::view-transition-group(persistent-footer)',
      '::view-transition-group(persistent-dashboard-header)',
      '::view-transition-group(persistent-dashboard-sidebar)',
      '@media (prefers-reduced-motion: reduce)',
      '::view-transition-group(*)',
    ]) {
      expect(css).toContain(selector)
    }
  })

  it('isolates persistent public and Dashboard chrome from route snapshots', () => {
    expect(source('src/components/public-site/public-header.tsx')).toContain(
      "viewTransitionName: 'persistent-header'",
    )
    expect(source('src/components/public-site/public-footer.tsx')).toContain(
      "viewTransitionName: 'persistent-footer'",
    )

    const dashboardLayout = source('src/components/studio/studio-shell.tsx')
    const dashboardSidebar = source('src/components/ui/sidebar.tsx')

    expect(dashboardLayout).toContain(
      "viewTransitionName: 'persistent-dashboard-header'",
    )
    expect(dashboardSidebar).toContain(
      "viewTransitionName: 'persistent-dashboard-sidebar'",
    )
  })

  it('switches the persistent header active border without carrying the previous route state', () => {
    const css = source('src/app/[locale]/global.css')
    const navigationRule = css.match(
      /\.heritage-nav a \{(?<body>[\s\S]*?)\n\}/u,
    )

    expect(navigationRule?.groups?.body).toBeDefined()
    expect(navigationRule?.groups?.body).not.toMatch(
      /transition:[\s\S]*border-color/u,
    )
  })

  it('types lateral shell navigation and forward catalogue navigation', () => {
    for (const path of [
      'src/components/public-site/public-header.tsx',
      'src/components/public-site/public-footer.tsx',
      'src/components/public-site/locale-switcher.tsx',
    ]) {
      expect(source(path)).toContain('NAV_LATERAL_TRANSITION')
    }

    expect(
      source('src/components/public-site/public-artwork-grid.tsx'),
    ).toMatch(/NAV_FORWARD_TRANSITION/u)
    expect(
      source('src/components/public-site/public-editorial-card.tsx'),
    ).toMatch(/NAV_FORWARD_TRANSITION/u)
  })

  it('wraps both public and Dashboard route families at page-template level', () => {
    for (const path of [
      'src/app/[locale]/(root)/template.tsx',
      'src/app/[locale]/dashboard/template.tsx',
    ]) {
      expect(source(path)).toContain('<PublicPageTransition>')
    }
  })

  it('continues artwork card image and title transitions into the framed detail hero', () => {
    const workDetail = source('src/app/[locale]/(root)/works/[slug]/page.tsx')
    const workMedia = source(
      'src/components/public-site/public-work-media.tsx',
    )

    expect(workDetail).toContain('<PublicWorkMedia')
    expect(workMedia).toContain('<PublicArtworkFrame')
    expect(workDetail).toContain(
      '<SharedEditorialTransition kind="image" publicKey={work.slug}>',
    )
    expect(workDetail).toContain(
      '<SharedEditorialTransition kind="title" publicKey={work.slug}>',
    )
  })

  it('types shared public actions and programmatic navigation', () => {
    expect(
      source('src/components/public-site/public-editorial-hero.tsx'),
    ).toContain('NAV_FORWARD_TRANSITION')
    expect(
      source('src/components/public-site/public-managed-primitives.tsx'),
    ).toContain('NAV_FORWARD_TRANSITION')
    expect(source('src/hooks/use-server-action.tsx')).toContain(
      'transitionTypes: [...NAV_FORWARD_TRANSITION]',
    )
    expect(source('src/components/molecules/app-tools.tsx')).toContain(
      'transitionTypes: [...NAV_LATERAL_TRANSITION]',
    )
  })
})
