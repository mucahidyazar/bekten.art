// @vitest-environment jsdom

import Link from 'next/link'

import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  Sidebar,
  SidebarInset,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from './sidebar'

function setMobileViewport(matches: boolean) {
  vi.stubGlobal('matchMedia', () => ({
    addEventListener: vi.fn(),
    matches,
    media: '(max-width: 767px)',
    removeEventListener: vi.fn(),
  }))
}

describe('Dashboard sidebar accessibility', () => {
  beforeEach(() => setMobileViewport(true))

  it('exposes drawer state and isolates page content while the mobile dialog is open', async () => {
    const user = userEvent.setup()

    render(
      <SidebarProvider>
        <Sidebar>
          <nav aria-label="Studio">
            <Link href="/dashboard">Overview</Link>
          </nav>
        </Sidebar>
        <SidebarInset>
          <SidebarTrigger />
          <button type="button">Page action</button>
        </SidebarInset>
      </SidebarProvider>,
    )

    const trigger = screen.getByRole('button', {
      name: 'Expand Studio navigation',
    })

    expect(trigger).toHaveAttribute('aria-controls', 'studio-navigation-mobile')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)

    expect(
      screen.getByRole('dialog', {name: 'Studio navigation'}),
    ).toBeVisible()
    expect(
      screen.getByRole('button', {name: 'Close Studio navigation'}),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText('Page action').closest('[data-slot="sidebar-inset"]'),
    ).toHaveAttribute('inert')
  })

  it('keeps a visible keyboard focus treatment on sidebar links', () => {
    setMobileViewport(false)

    render(
      <SidebarProvider>
        <SidebarMenuButton>
          <Link href="/dashboard">Overview</Link>
        </SidebarMenuButton>
      </SidebarProvider>,
    )

    expect(
      screen
        .getByRole('link', {name: 'Overview'})
        .closest('[data-slot="sidebar-menu-button"]'),
    ).toHaveClass('[&_a]:focus-visible:ring-2')
  })
})
