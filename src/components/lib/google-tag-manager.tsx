'use client'

import {usePathname} from 'next/navigation'
import Script from 'next/script'

import {useEffect, useRef} from 'react'

import {useConsent} from '@/components/consent/consent-provider'
import {configs} from '@/configs'
import {GTM_ID, virtualPageview} from '@/lib/gtag'

type GoogleTagManagerProps = {
  nonce?: string
}

export function GoogleTagManager({nonce}: GoogleTagManagerProps) {
  const pathname = usePathname()
  const {decision, hydrated} = useConsent()
  const currentPath = pathname
  const previousPath = useRef(currentPath)

  useEffect(() => {
    if (previousPath.current === currentPath) return

    previousPath.current = currentPath

    if (configs.isProduction && GTM_ID && decision?.analytics) {
      virtualPageview(currentPath)
    }
  }, [currentPath, decision?.analytics])

  const consentAllowsGoogleTags = Boolean(
    hydrated && (decision?.analytics || decision?.marketing),
  )

  if (!configs.isProduction || !GTM_ID || !consentAllowsGoogleTags) return null

  return (
    <Script
      id="google-tag-manager"
      nonce={nonce}
      src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`}
      strategy="afterInteractive"
    />
  )
}
