// @vitest-environment jsdom

import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderToStaticMarkup} from 'react-dom/server'
import {describe, expect, it, vi} from 'vitest'

import {ConsentBootstrap} from './consent-bootstrap'
import {ConsentManager, ConsentProvider, useConsent} from './consent-provider'
import {ConsentGoogleMap, getSafeGoogleMapsEmbedUrl} from './google-map'
import {
  CONSENT_STORAGE_KEY,
  createConsentDecision,
  parseStoredConsent,
} from './model'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

function renderConsentUi(children?: React.ReactNode) {
  return render(
    <ConsentProvider>
      <ConsentManager />
      {children}
    </ConsentProvider>,
  )
}

function ConsentProbe() {
  const {decision} = useConsent()

  return <output>{decision?.analytics ? 'analytics-on' : 'analytics-off'}</output>
}

describe('Google consent preferences', () => {
  it('rejects malformed and obsolete stored decisions', () => {
    expect(parseStoredConsent('not-json')).toBeNull()
    expect(
      parseStoredConsent(
        JSON.stringify({
          version: 0,
          analytics: true,
          marketing: true,
          externalMedia: true,
        }),
      ),
    ).toBeNull()
    expect(
      parseStoredConsent(
        JSON.stringify({
          version: 1,
          analytics: 'yes',
          marketing: false,
          externalMedia: false,
        }),
      ),
    ).toBeNull()
  })

  it('renders a nonce-protected default-denied bootstrap before GTM', () => {
    const markup = renderToStaticMarkup(<ConsentBootstrap nonce="request-nonce" />)

    expect(markup).toContain('nonce="request-nonce"')
    expect(markup).toContain("'consent','default'")
    expect(markup).toContain("analytics_storage:'denied'")
    expect(markup).toContain("ad_user_data:'denied'")
    expect(markup).toContain("ad_personalization:'denied'")
    expect(markup.indexOf("'consent','default'")).toBeLessThan(
      markup.indexOf(CONSENT_STORAGE_KEY),
    )
    expect(markup.indexOf("'consent','update'")).toBeLessThan(
      markup.indexOf("event:'gtm.js'"),
    )
  })

  it('offers equal accept and reject controls and persists rejection', async () => {
    const user = userEvent.setup()
    const gtag = vi.fn()

    window.gtag = gtag

    renderConsentUi()

    const reject = await screen.findByRole('button', {name: 'rejectAll'})

    expect(screen.getByRole('button', {name: 'acceptAll'})).toBeVisible()
    expect(reject).toBeVisible()

    await user.click(reject)

    await waitFor(() => expect(screen.queryByRole('region')).toBeNull())
    expect(parseStoredConsent(localStorage.getItem(CONSENT_STORAGE_KEY))).toMatchObject(
      {
        analytics: false,
        externalMedia: false,
        marketing: false,
      },
    )
    expect(gtag).toHaveBeenCalledWith(
      'consent',
      'update',
      expect.objectContaining({
        ad_personalization: 'denied',
        ad_user_data: 'denied',
        ad_storage: 'denied',
        analytics_storage: 'denied',
      }),
    )
  })

  it('lets a visitor revise granular preferences', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(createConsentDecision(false, false, false)),
    )

    renderConsentUi()

    await user.click(
      await screen.findByRole('button', {name: 'openPreferences'}),
    )
    await user.click(screen.getByRole('checkbox', {name: 'analyticsTitle'}))
    await user.click(screen.getByRole('checkbox', {name: 'externalMediaTitle'}))
    await user.click(screen.getByRole('button', {name: 'savePreferences'}))

    expect(parseStoredConsent(localStorage.getItem(CONSENT_STORAGE_KEY))).toMatchObject(
      {
        analytics: true,
        externalMedia: true,
        marketing: false,
      },
    )
  })

  it('synchronizes a consent change made in another browser tab', async () => {
    const gtag = vi.fn()

    window.gtag = gtag
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(createConsentDecision(false, false, false)),
    )
    renderConsentUi(<ConsentProbe />)

    expect(await screen.findByText('analytics-off')).toBeVisible()

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: CONSENT_STORAGE_KEY,
        newValue: JSON.stringify(createConsentDecision(true, false, false)),
      }),
    )

    expect(await screen.findByText('analytics-on')).toBeVisible()
    expect(gtag).toHaveBeenCalledWith(
      'consent',
      'update',
      expect.objectContaining({analytics_storage: 'granted'}),
    )
  })

  it('does not contact Google Maps until external media consent is granted', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(createConsentDecision(false, false, false)),
    )

    renderConsentUi(
      <ConsentGoogleMap
        src="https://www.google.com/maps/embed?pb=studio"
        title="Studio map"
      />,
    )

    expect(await screen.findByText('mapBlockedDescription')).toBeVisible()
    expect(screen.queryByTitle('Studio map')).toBeNull()

    await user.click(await screen.findByRole('button', {name: 'allowMap'}))

    expect(await screen.findByTitle('Studio map')).toHaveAttribute(
      'src',
      'https://www.google.com/maps/embed?pb=studio',
    )
  })

  it('never embeds non-Google URLs from contact data', async () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(createConsentDecision(true, true, true)),
    )

    renderConsentUi(
      <ConsentGoogleMap src="https://example.com/tracker" title="Studio map" />,
    )

    expect(await screen.findByText('mapUnavailable')).toBeVisible()
    expect(screen.queryByTitle('Studio map')).toBeNull()
    expect(getSafeGoogleMapsEmbedUrl('not a URL')).toBeNull()
  })
})
