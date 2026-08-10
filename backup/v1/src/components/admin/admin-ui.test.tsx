import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: () => '/tr/admin/media',
}))

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

import {AdminShell} from './admin-shell'
import {
  AdminEmptyState,
  AdminMetric,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminStatus,
  formatAdminBytes,
  formatAdminDate,
} from './admin-ui'

describe('admin UI primitives', () => {
  it('renders a labelled metric without inventing trend data', () => {
    render(
      <AdminMetric
        description="Verified accounts in PostgreSQL"
        label="Users"
        value={9}
      />,
    )

    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
    expect(
      screen.getByText('Verified accounts in PostgreSQL'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('exposes an honest, accessible empty state', () => {
    render(
      <AdminEmptyState
        description="No audit event matches these filters."
        title="No results"
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('No results')
  })

  it('builds locale-aware pagination links and preserves filters', () => {
    render(
      <AdminPagination
        basePath="/tr/admin/audit"
        page={2}
        pageSize={25}
        searchParams={{entityType: 'MediaObject', query: 'upload'}}
        total={80}
      />,
    )

    expect(screen.getByRole('link', {name: 'Previous page'})).toHaveAttribute(
      'href',
      '/tr/admin/audit?entityType=MediaObject&query=upload&page=1',
    )
    expect(screen.getByRole('link', {name: 'Next page'})).toHaveAttribute(
      'href',
      '/tr/admin/audit?entityType=MediaObject&query=upload&page=3',
    )
    expect(screen.getByText('26–50 of 80')).toBeInTheDocument()
  })

  it('formats dates and bytes consistently for the selected locale', () => {
    expect(formatAdminBytes(512)).toBe('512 B')
    expect(formatAdminBytes(1_536)).toBe('1.5 KB')
    expect(formatAdminBytes(12 * 1_024 * 1_024)).toBe('12 MB')
    expect(
      formatAdminDate(new Date('2026-08-09T10:00:00.000Z'), 'en'),
    ).toContain('2026')
    expect(formatAdminDate(null, 'en')).toBe('Never')
  })

  it('renders optional panel and page-header content without empty copy', () => {
    render(
      <>
        <AdminPageHeader description="Live data" title="Operations" />
        <AdminPanel title="Queue">
          <p>Queue data</p>
        </AdminPanel>
        <AdminStatus label="Pending" />
        <AdminStatus label="Failed" tone="danger" />
      </>,
    )

    expect(screen.getByRole('heading', {name: 'Operations'})).toBeVisible()
    expect(screen.getByRole('heading', {name: 'Queue'})).toBeVisible()
    expect(screen.getByText('Pending')).toBeVisible()
    expect(screen.getByText('Failed')).toBeVisible()
  })

  it('handles the first, final and empty pagination boundaries', () => {
    const {rerender} = render(
      <AdminPagination
        basePath="/en/admin/users"
        page={1}
        pageSize={25}
        searchParams={{}}
        total={80}
      />,
    )

    expect(
      screen.queryByRole('link', {name: 'Previous page'}),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Next page'})).toBeVisible()

    rerender(
      <AdminPagination
        basePath="/en/admin/users"
        page={4}
        pageSize={25}
        searchParams={{}}
        total={80}
      />,
    )
    expect(screen.getByRole('link', {name: 'Previous page'})).toBeVisible()
    expect(
      screen.queryByRole('link', {name: 'Next page'}),
    ).not.toBeInTheDocument()

    rerender(
      <AdminPagination
        basePath="/en/admin/users"
        page={1}
        pageSize={25}
        searchParams={{}}
        total={0}
      />,
    )
    expect(screen.getByText('0–0 of 0')).toBeVisible()
  })
})

describe('AdminShell', () => {
  it('provides the real administration areas with locale-aware links', () => {
    render(
      <AdminShell
        locale="tr"
        user={{email: 'admin@example.com', name: 'Studio Admin'}}
      >
        <p>Page content</p>
      </AdminShell>,
    )

    expect(
      screen.getAllByRole('navigation', {name: 'Admin sections'}),
    ).toHaveLength(2)
    expect(screen.getAllByRole('link', {name: /Media/})[0]).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getAllByRole('link', {name: /Users/})[0]).toHaveAttribute(
      'href',
      '/tr/admin/users',
    )
    expect(screen.queryByRole('link', {name: /Store/})).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', {name: /Analytics/}),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Studio Admin')).toBeInTheDocument()
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('signs out through NextAuth with the current locale', async () => {
    const {signOut} = await import('next-auth/react')

    render(
      <AdminShell locale="tr" user={{email: null, name: null}}>
        <p>Page content</p>
      </AdminShell>,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Sign out'}))

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({callbackUrl: '/tr'})
    })
  })
})
