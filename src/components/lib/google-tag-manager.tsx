'use client'

import {usePathname} from 'next/navigation'

import {useEffect, useRef} from 'react'

import {initializeGoogleConsent} from '@/components/consent/consent-bootstrap'
import {useConsent} from '@/components/consent/consent-provider'
import {configs} from '@/configs'
import {GTM_ID, virtualPageview} from '@/lib/gtag'
import {isPrivateDashboardPath} from '@/lib/private-dashboard-path'

type GoogleTagManagerProps = {
  nonce?: string
}

export function GoogleTagManager({nonce}: GoogleTagManagerProps) {
  const pathname = usePathname()
  const {decision, hydrated} = useConsent()
  const currentPath = pathname
  const previousPath = useRef(currentPath)

  const consentAllowsGoogleTags = Boolean(
    hydrated && (decision?.analytics || decision?.marketing),
  )
  const shouldLoadGoogleTags = Boolean(
    !isPrivateDashboardPath(currentPath) &&
    configs.isProduction &&
    GTM_ID &&
    consentAllowsGoogleTags,
  )

  useEffect(() => {
    if (isPrivateDashboardPath(currentPath)) return

    initializeGoogleConsent(decision)
  }, [currentPath, decision])

  useEffect(() => {
    if (
      !shouldLoadGoogleTags ||
      document.getElementById('google-tag-manager')
    ) {
      return
    }

    const script = document.createElement('script')

    script.async = true
    script.id = 'google-tag-manager'
    script.nonce = nonce ?? ''
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`
    document.head.append(script)
  }, [nonce, shouldLoadGoogleTags])

  useEffect(() => {
    if (previousPath.current === currentPath) return

    previousPath.current = currentPath

    if (
      !isPrivateDashboardPath(currentPath) &&
      configs.isProduction &&
      GTM_ID &&
      decision?.analytics
    ) {
      virtualPageview(currentPath)
    }
  }, [currentPath, decision?.analytics])

  return null
}
