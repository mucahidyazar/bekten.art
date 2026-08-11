import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

vi.mock('next-intl', () => ({useLocale: () => 'tr'}))

import NotFound from './not-found'

describe('localized not-found boundary', () => {
  it('renders the active locale and returns to its localized home', () => {
    render(<NotFound />)

    expect(
      screen.getByText('Aradığınız sayfa bulunamadı.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Ana sayfaya dön'})).toHaveAttribute(
      'href',
      '/tr',
    )
  })
})
