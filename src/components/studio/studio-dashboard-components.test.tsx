import Link from 'next/link'

import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {
  StudioEmptyState,
  StudioMetricCard,
  StudioPageHeader,
} from './studio-dashboard-components'

describe('Studio dashboard components', () => {
  it('renders a consistent editorial page heading with an optional action', () => {
    render(
      <StudioPageHeader
        action={<Link href="/dashboard/artworks/new">Create artwork</Link>}
        description="Manage the working archive."
        eyebrow="Editorial archive"
        title="Artworks"
      />,
    )

    expect(screen.getByRole('heading', {name: 'Artworks'})).toBeVisible()
    expect(screen.getByText('Manage the working archive.')).toBeVisible()
    expect(screen.getByRole('link', {name: 'Create artwork'})).toBeVisible()
    expect(screen.getByTestId('studio-page-header')).toBeVisible()
  })

  it('uses shadcn cards for metrics and calm empty states', () => {
    render(
      <>
        <StudioMetricCard label="Published artworks" value={12} />
        <StudioEmptyState
          action={<Link href="/dashboard/artworks/new">Create artwork</Link>}
          description="Begin with a private draft."
          title="No artworks yet."
        />
      </>,
    )

    expect(screen.getByText('Published artworks')).toBeVisible()
    expect(screen.getByText('12')).toBeVisible()
    expect(screen.getByText('No artworks yet.')).toBeVisible()
    expect(screen.getByTestId('studio-metric-card')).toBeVisible()
    expect(screen.getByTestId('studio-empty-state')).toBeVisible()
  })
})
