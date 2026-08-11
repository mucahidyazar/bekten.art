import {type ConsentDecision, toGoogleConsentState} from './model'

const defaultConsentState = Object.freeze({
  ad_personalization: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
  wait_for_update: 500,
})

function hasGtmBootstrap(dataLayer: readonly unknown[]) {
  return dataLayer.some(
    item =>
      item !== null &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      'event' in item &&
      item.event === 'gtm.js' &&
      'bektenConsentBootstrap' in item &&
      item.bektenConsentBootstrap === true,
  )
}

export function initializeGoogleConsent(decision?: ConsentDecision | null) {
  const dataLayer = (window.dataLayer ??= [])
  const alreadyInitialized = hasGtmBootstrap(dataLayer)

  window.gtag ??= (...arguments_) => {
    window.dataLayer?.push(arguments_)
  }

  if (!alreadyInitialized) {
    window.gtag('consent', 'default', defaultConsentState)
    window.gtag('set', 'ads_data_redaction', true)
    window.gtag('set', 'url_passthrough', false)
  }

  if (decision) {
    window.gtag('consent', 'update', toGoogleConsentState(decision))
  }

  if (!alreadyInitialized) {
    dataLayer.push({
      bektenConsentBootstrap: true,
      event: 'gtm.js',
      'gtm.start': Date.now(),
    })
  }
}
