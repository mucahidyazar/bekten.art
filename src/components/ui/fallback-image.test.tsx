import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

vi.mock('next/image', () => ({
  default: ({alt, ...props}: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}))

import {FallbackImage} from './fallback-image'

describe('FallbackImage', () => {
  it('removes a failed remote image instead of showing placeholder content', () => {
    render(
      <FallbackImage
        alt="Published artwork"
        height={200}
        src="https://media.example.com/art.jpg"
        width={300}
      />,
    )

    fireEvent.error(screen.getByRole('img', {name: 'Published artwork'}))

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
