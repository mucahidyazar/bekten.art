// @vitest-environment jsdom

import {render, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const navigation = vi.hoisted(() => ({pathname: '/en', search: ''}))
const consent = vi.hoisted(() => ({
  decision: {
    analytics: true,
    externalMedia: false,
    marketing: false,
    savedAt: '2026-08-09T00:00:00.000Z',
    version: 1 as const,
  } as {
    analytics: boolean
    externalMedia: boolean
    marketing: boolean
    savedAt: string
    version: 1
  } | null,
  hydrated: true,
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}))
vi.mock('next/script', () => ({
  default: (props: React.ComponentProps<'script'>) => <script {...props} />,
}))
vi.mock('@/configs', () => ({configs: {isProduction: true}}))
vi.mock('@/components/consent/consent-provider', () => ({
  useConsent: () => consent,
}))
vi.mock('@/lib/gtag', () => ({
  GTM_ID: 'GTM-TEST123',
  virtualPageview: (page: string) =>
    window.dataLayer?.push({event: 'virtual_page_view', page_path: page}),
}))

import {GoogleTagManager} from './google-tag-manager'

describe('GoogleTagManager', () => {
  beforeEach(() => {
    navigation.pathname = '/en'
    navigation.search = ''
    consent.decision = {
      analytics: true,
      externalMedia: false,
      marketing: false,
      savedAt: '2026-08-09T00:00:00.000Z',
      version: 1,
    }
    consent.hydrated = true
    window.dataLayer = [{'gtm.start': Date.now(), event: 'gtm.js'}]
  })

  it('does not load GTM before consent or after all optional purposes are rejected', () => {
    consent.decision = null
    const {container, rerender} = render(<GoogleTagManager />)

    expect(container.querySelector('script')).toBeNull()

    consent.decision = {
      analytics: false,
      externalMedia: false,
      marketing: false,
      savedAt: '2026-08-09T00:00:00.000Z',
      version: 1,
    }
    rerender(<GoogleTagManager />)

    expect(container.querySelector('script')).toBeNull()
  })

  it('loads one external GTM script without a consent-bypassing iframe', async () => {
    const {container} = render(<GoogleTagManager nonce="request-nonce" />)

    await waitFor(() =>
      expect(
        container.querySelector(
          'script[src="https://www.googletagmanager.com/gtm.js?id=GTM-TEST123"]',
        ),
      ).toBeInTheDocument(),
    )
    expect(container.querySelectorAll('script')).toHaveLength(1)
    expect(container.querySelector('script')).toHaveAttribute(
      'nonce',
      'request-nonce',
    )
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('does not duplicate the initial page view and emits one virtual view on navigation', async () => {
    const {rerender} = render(<GoogleTagManager />)

    await waitFor(() =>
      expect(
        dataLayerEvents().filter(item => item.event === 'gtm.js'),
      ).toHaveLength(1),
    )
    expect(
      dataLayerEvents().filter(item => item.event === 'virtual_page_view'),
    ).toHaveLength(0)

    navigation.pathname = '/en/gallery'
    navigation.search = 'filter=painting'
    rerender(<GoogleTagManager />)

    await waitFor(() =>
      expect(
        dataLayerEvents().filter(item => item.event === 'virtual_page_view'),
      ).toEqual([
        expect.objectContaining({
          page_path: '/en/gallery',
        }),
      ]),
    )
  })

  it('never sends authentication or newsletter tokens in virtual page views', async () => {
    const {rerender} = render(<GoogleTagManager />)

    navigation.pathname = '/en/reset-password'
    navigation.search = 'token=super-secret-token&callbackUrl=%2Fen%2Fadmin'
    rerender(<GoogleTagManager />)

    await waitFor(() =>
      expect(
        dataLayerEvents().filter(item => item.event === 'virtual_page_view'),
      ).toEqual([
        expect.objectContaining({page_path: '/en/reset-password'}),
      ]),
    )
    expect(JSON.stringify(window.dataLayer)).not.toContain('super-secret-token')
  })
})

function dataLayerEvents() {
  return (window.dataLayer ?? []).filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === 'object' && !Array.isArray(item),
  )
}
