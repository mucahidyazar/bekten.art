import {createElement} from 'react'

import type {HTMLAttributes, ReactNode} from 'react'

type PublicContainerElement =
  | 'article'
  | 'aside'
  | 'div'
  | 'footer'
  | 'header'
  | 'main'
  | 'nav'
  | 'section'

type PublicContainerProps = Readonly<
  HTMLAttributes<HTMLElement> & {
    as?: PublicContainerElement
    children: ReactNode
  }
>

export function PublicContainer({
  as = 'div',
  children,
  className,
  ...properties
}: PublicContainerProps) {
  const resolvedClassName = ['heritage-shell', className]
    .filter(Boolean)
    .join(' ')

  return createElement(
    as,
    {
      ...properties,
      className: resolvedClassName,
      'data-public-container': '',
    },
    children,
  )
}
