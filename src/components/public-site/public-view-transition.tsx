import {Fragment, ViewTransition} from 'react'

import type {ReactNode} from 'react'

const privateUuidPattern =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u
const sharedPublicKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

export const NAV_BACK_TRANSITION = Object.freeze(['nav-back'])
export const NAV_FORWARD_TRANSITION = Object.freeze(['nav-forward'])
export const NAV_LATERAL_TRANSITION = Object.freeze(['nav-lateral'])

const NativeViewTransition = ViewTransition

const pageEnter = Object.freeze({
  'nav-back': 'nav-back',
  'nav-forward': 'nav-forward',
  'nav-lateral': 'fade-in',
  default: 'none',
})

const pageExit = Object.freeze({
  'nav-back': 'nav-back',
  'nav-forward': 'nav-forward',
  'nav-lateral': 'fade-out',
  default: 'none',
})

export function PublicPageTransition({
  children,
}: Readonly<{children: ReactNode}>) {
  if (!NativeViewTransition) return <Fragment>{children}</Fragment>

  return (
    <NativeViewTransition default="none" enter={pageEnter} exit={pageExit}>
      {children}
    </NativeViewTransition>
  )
}

export function SharedEditorialTransition({
  children,
  kind,
  publicKey,
}: Readonly<{
  children: ReactNode
  kind: 'image' | 'title'
  publicKey: string
}>) {
  if (
    publicKey.length > 96 ||
    privateUuidPattern.test(publicKey) ||
    !sharedPublicKeyPattern.test(publicKey)
  ) {
    throw new Error('VIEW_TRANSITION_PUBLIC_KEY_INVALID')
  }

  if (!NativeViewTransition) return <Fragment>{children}</Fragment>

  return (
    <NativeViewTransition
      default="none"
      name={`editorial-${kind}-${publicKey}`}
      share={kind === 'image' ? 'morph' : 'text-morph'}
    >
      {children}
    </NativeViewTransition>
  )
}
