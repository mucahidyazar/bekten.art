import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {EditorialEntryList} from './editorial-entry-list'

describe('EditorialEntryList', () => {
  it('renders editable records with their workflow state', () => {
    render(
      <EditorialEntryList
        entries={[
          {
            id: '00000000-0000-4000-8000-000000000002',
            locale: 'en',
            slug: 'winter-light',
            status: 'DRAFT',
            title: 'Winter Light',
            updatedAt: new Date('2026-08-11T08:00:00.000Z'),
            version: 3,
          },
        ]}
        label="Artworks"
        routeSegment="artworks"
      />,
    )

    expect(screen.getByRole('heading', {name: 'Artworks'})).toBeVisible()
    expect(screen.getByRole('link', {name: 'Winter Light'})).toHaveAttribute(
      'href',
      '/dashboard/artworks/00000000-0000-4000-8000-000000000002',
    )
    expect(screen.getAllByText('Draft')).toHaveLength(2)
    expect(screen.getByText('Version 3')).toBeVisible()
  })

  it('gives an editor a direct creation path from an empty collection', () => {
    render(
      <EditorialEntryList
        entries={[]}
        label="Collections"
        routeSegment="collections"
      />,
    )

    expect(screen.getByText('No collections yet.')).toBeVisible()
    expect(
      screen.getByRole('link', {name: 'Create collection'}),
    ).toHaveAttribute('href', '/dashboard/collections/new')
  })

  it('exposes bounded ordering controls and preserves active filters', () => {
    const entries = [
      {
        id: '00000000-0000-4000-8000-000000000002',
        locale: 'tr' as const,
        slug: 'birinci-eser',
        status: 'DRAFT' as const,
        title: 'Birinci Eser',
        updatedAt: new Date('2026-08-11T08:00:00.000Z'),
        version: 1,
      },
      {
        id: '00000000-0000-4000-8000-000000000003',
        locale: 'tr' as const,
        slug: 'ikinci-eser',
        status: 'DRAFT' as const,
        title: 'İkinci Eser',
        updatedAt: new Date('2026-08-11T08:00:00.000Z'),
        version: 1,
      },
    ]

    render(
      <EditorialEntryList
        currentLocale="tr"
        currentStatus="DRAFT"
        entries={entries}
        label="Artworks"
        reorderAction={vi.fn(async () => undefined)}
        routeSegment="artworks"
      />,
    )

    expect(screen.getByLabelText('Locale')).toHaveValue('tr')
    expect(screen.getByLabelText('Status')).toHaveValue('DRAFT')
    expect(
      screen.getAllByRole('button', {name: 'Move earlier'})[0],
    ).toBeDisabled()
    expect(
      screen.getAllByRole('button', {name: 'Move later'})[1],
    ).toBeDisabled()
  })
})
