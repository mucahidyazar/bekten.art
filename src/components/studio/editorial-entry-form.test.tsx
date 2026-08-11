import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {EditorialEntryForm} from './editorial-entry-form'

const action = vi.fn(async state => state)

describe('EditorialEntryForm', () => {
  it('renders the complete accessible artwork editing surface', () => {
    render(
      <EditorialEntryForm
        action={action}
        entityId="00000000-0000-4000-8000-000000000002"
        entityType="ARTWORK"
        initialValue={{
          availability: 'ON_REQUEST',
          description:
            'A layered oil painting developed through quiet observations of winter light.',
          displayOrder: 0,
          locale: 'en',
          mediaPlacements: [],
          seo: {
            canonicalPath: '/en/works/winter-light',
            description:
              'An editorial record of Winter Light and its material history in the studio archive.',
            noIndex: false,
            title: 'Winter Light — Bekten Art',
          },
          slug: 'winter-light',
          title: 'Winter Light',
        }}
        status="DRAFT"
      />,
    )

    expect(screen.getByLabelText('Title')).toHaveValue('Winter Light')
    expect(
      (screen.getByLabelText('Description') as HTMLTextAreaElement).value,
    ).toContain('layered oil painting')
    expect(screen.getByLabelText('Availability')).toHaveValue('ON_REQUEST')
    expect(screen.getByLabelText('SEO title')).toHaveValue(
      'Winter Light — Bekten Art',
    )
    expect(screen.getByRole('button', {name: 'Save draft'})).toBeVisible()
    expect(screen.getByRole('button', {name: 'Publish'})).toBeVisible()
    expect(screen.getByRole('button', {name: 'Archive'})).toBeVisible()
    expect(screen.getByRole('link', {name: 'Preview draft'})).toHaveAttribute(
      'href',
      '/dashboard/artworks/00000000-0000-4000-8000-000000000002/preview',
    )
  })

  it('does not offer archive or preview for an unsaved entry', () => {
    render(
      <EditorialEntryForm
        action={action}
        entityId={null}
        entityType="COLLECTION"
        initialValue={{}}
        status={null}
      />,
    )

    expect(screen.getByLabelText('Title')).toBeRequired()
    expect(
      screen.queryByRole('button', {name: 'Archive'}),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', {name: 'Publish'}),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', {name: 'Preview draft'}),
    ).not.toBeInTheDocument()
  })
})
