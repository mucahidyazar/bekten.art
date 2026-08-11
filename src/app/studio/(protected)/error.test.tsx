import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import StudioError from './error'

describe('Studio error boundary', () => {
  it('offers an accessible retry without exposing infrastructure details', () => {
    const reset = vi.fn()

    render(
      <StudioError
        error={new Error('postgresql://secret-user:secret-password@database')}
        reset={reset}
      />,
    )

    expect(screen.getByRole('alert')).not.toHaveTextContent('secret-password')
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}))
    expect(reset).toHaveBeenCalledOnce()
  })
})
