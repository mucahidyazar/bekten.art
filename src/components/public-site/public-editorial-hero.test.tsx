import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {PublicContainer} from './public-container'
import {PublicEditorialHero} from './public-editorial-hero'

describe('shared public editorial layout primitives', () => {
  it('uses one canonical container contract without replacing semantic elements', () => {
    render(
      <PublicContainer as="section" className="route-section">
        Shared content
      </PublicContainer>,
    )

    const container = screen.getByText('Shared content')

    expect(container.tagName).toBe('SECTION')
    expect(container).toHaveClass('heritage-shell', 'route-section')
    expect(container).toHaveAttribute('data-public-container')
  })

  it('renders the Collector-based two-column hero with the real frame overlay', () => {
    render(
      <PublicEditorialHero
        action={{href: '/works', label: 'Explore works'}}
        eyebrow="Bekten Studio"
        fallbackAlt="Framed steppe artwork"
        fallbackSrc="/img/heritage-landscape-hero.jpg"
        locale="en"
        paragraphs={['Landscape, memory and presence in quiet conversation.']}
        title="The artist"
      />,
    )

    const hero = screen.getByRole('banner')

    expect(hero).toHaveAttribute('data-public-editorial-hero')
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
      'The artist',
    )
    expect(screen.getByRole('img', {name: 'Framed steppe artwork'})).toBeVisible()
    expect(screen.getByTestId('heritage-frame-overlay')).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Explore works'})).toHaveAttribute(
      'href',
      '/works',
    )
  })
})
