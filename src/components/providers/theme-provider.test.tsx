// @vitest-environment jsdom

import {render} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {ThemeProvider} from './theme-provider'

const nextThemesProvider = vi.fn(
  ({children}: React.PropsWithChildren<Record<string, unknown>>) => children,
)

vi.mock('next-themes', () => ({
  ThemeProvider: (props: React.PropsWithChildren<Record<string, unknown>>) =>
    nextThemesProvider(props),
}))

describe('ThemeProvider', () => {
  it('forwards the request nonce to the inline theme bootstrap', () => {
    render(
      <ThemeProvider nonce="request-nonce">
        <span>content</span>
      </ThemeProvider>,
    )

    expect(nextThemesProvider).toHaveBeenCalledWith(
      expect.objectContaining({nonce: 'request-nonce'}),
    )
  })
})
