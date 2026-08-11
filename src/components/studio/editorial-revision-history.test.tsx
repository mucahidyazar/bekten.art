import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {EditorialRevisionHistory} from './editorial-revision-history'

describe('EditorialRevisionHistory', () => {
  it('shows immutable versions, their field comparison and restore action', () => {
    render(
      <EditorialRevisionHistory
        currentVersion={5}
        restoreAction={vi.fn(async () => undefined)}
        revisions={[
          {
            changedFields: ['description', 'seo'],
            createdAt: new Date('2026-08-11T08:00:00.000Z'),
            id: '00000000-0000-4000-8000-000000000020',
            operation: 'PUBLISH',
            version: 4,
          },
        ]}
      />,
    )

    expect(
      screen.getByRole('heading', {name: 'Revision history'}),
    ).toBeVisible()
    expect(screen.getByText('Version 4')).toBeVisible()
    expect(screen.getByText('Changed: description, seo')).toBeVisible()
    expect(
      screen.getByRole('button', {name: 'Restore version 4'}),
    ).toBeVisible()
  })

  it('explains the empty history state', () => {
    render(
      <EditorialRevisionHistory
        currentVersion={1}
        restoreAction={vi.fn(async () => undefined)}
        revisions={[]}
      />,
    )

    expect(screen.getByText('No published revisions yet.')).toBeVisible()
  })

  it('marks the current restored revision without offering a redundant restore', () => {
    render(
      <EditorialRevisionHistory
        currentVersion={5}
        restoreAction={vi.fn(async () => undefined)}
        revisions={[
          {
            changedFields: [],
            createdAt: new Date('2026-08-11T08:00:00.000Z'),
            id: '00000000-0000-4000-8000-000000000020',
            operation: 'RESTORE',
            version: 5,
          },
        ]}
      />,
    )

    expect(screen.getByText('Restored · 2026-08-11 08:00')).toBeVisible()
    expect(screen.getByText('Initial published snapshot')).toBeVisible()
    expect(screen.getByText('Current version')).toBeVisible()
    expect(
      screen.queryByRole('button', {name: /restore/i}),
    ).not.toBeInTheDocument()
  })
})
