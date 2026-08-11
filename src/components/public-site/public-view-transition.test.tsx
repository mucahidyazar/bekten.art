import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>()

  return {
    ...actual,
    ViewTransition: ({
      children,
      default: defaultTransition,
      enter,
      exit,
      name,
      share,
    }: {
      children: React.ReactNode
      default?: unknown
      enter?: unknown
      exit?: unknown
      name?: string
      share?: unknown
    }) => (
      <div
        data-default={String(defaultTransition)}
        data-enter={JSON.stringify(enter)}
        data-exit={JSON.stringify(exit)}
        data-name={name}
        data-share={String(share)}
        data-testid="react-view-transition"
      >
        {children}
      </div>
    ),
  }
})

import {
  PublicPageTransition,
  SharedEditorialTransition,
} from './public-view-transition'

describe('native public view transitions', () => {
  it('uses explicit type maps and opts out of unrelated transitions', () => {
    render(
      <PublicPageTransition>
        <p>Route content</p>
      </PublicPageTransition>,
    )

    const transition = screen.getByTestId('react-view-transition')

    expect(transition).toHaveAttribute('data-default', 'none')
    expect(JSON.parse(transition.dataset.enter ?? '{}')).toEqual({
      'nav-back': 'nav-back',
      'nav-forward': 'nav-forward',
      'nav-lateral': 'fade-in',
      default: 'none',
    })
    expect(JSON.parse(transition.dataset.exit ?? '{}')).toEqual({
      'nav-back': 'nav-back',
      'nav-forward': 'nav-forward',
      'nav-lateral': 'fade-out',
      default: 'none',
    })
  })

  it.each([
    ['image', 'editorial-image-mountain-memory', 'morph'],
    ['title', 'editorial-title-mountain-memory', 'text-morph'],
  ] as const)(
    'creates a unique %s shared-element boundary',
    (kind, name, share) => {
      render(
        <SharedEditorialTransition kind={kind} publicKey="mountain-memory">
          <span>{kind}</span>
        </SharedEditorialTransition>,
      )

      expect(screen.getByTestId('react-view-transition')).toHaveAttribute(
        'data-name',
        name,
      )
      expect(screen.getByTestId('react-view-transition')).toHaveAttribute(
        'data-share',
        share,
      )
      expect(screen.getByTestId('react-view-transition')).toHaveAttribute(
        'data-default',
        'none',
      )
    },
  )

  it('rejects unsafe or ambiguous shared-element identifiers', () => {
    expect(() =>
      render(
        <SharedEditorialTransition kind="image" publicKey="../duplicate">
          <span>Unsafe</span>
        </SharedEditorialTransition>,
      ),
    ).toThrow('VIEW_TRANSITION_PUBLIC_KEY_INVALID')
  })

  it('rejects internal UUIDs as public transition keys', () => {
    expect(() =>
      render(
        <SharedEditorialTransition
          kind="image"
          publicKey="4cd43984-4904-4ddc-824c-13d875f59b42"
        >
          <span>Private identifier</span>
        </SharedEditorialTransition>,
      ),
    ).toThrow('VIEW_TRANSITION_PUBLIC_KEY_INVALID')
  })
})
