// @vitest-environment jsdom

import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {SectionHeader} from './section-header'

describe('SectionHeader', () => {
  it('renders public section copy without requiring account context', () => {
    render(
      <SectionHeader
        badgeText="Archive"
        badgeIcon="palette"
        title="Selected work"
        description="A public collection"
      />,
    )

    expect(screen.getByText('Archive')).toBeVisible()
    expect(screen.getByRole('heading', {name: 'Selected work'})).toBeVisible()
    expect(screen.getByText('A public collection')).toBeVisible()
  })
})
