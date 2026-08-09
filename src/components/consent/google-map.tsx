'use client'

import {MapPinIcon} from 'lucide-react'
import {useTranslations} from 'next-intl'

import {Button} from '@/components/ui/button'

import {useConsent} from './consent-provider'

type ConsentGoogleMapProps = {
  src: string
  title: string
}

export function ConsentGoogleMap({src, title}: ConsentGoogleMapProps) {
  const t = useTranslations('consent')
  const {allowExternalMedia, decision, hydrated} = useConsent()
  const safeSource = getSafeGoogleMapsEmbedUrl(src)

  if (!safeSource) {
    return <MapPlaceholder description={t('mapUnavailable')} />
  }

  if (!hydrated || !decision?.externalMedia) {
    return (
      <MapPlaceholder
        action={
          hydrated ? (
            <Button type="button" variant="outline" onClick={allowExternalMedia}>
              {t('allowMap')}
            </Button>
          ) : null
        }
        description={t('mapBlockedDescription')}
        title={t('mapBlockedTitle')}
      />
    )
  }

  return (
    <iframe
      allowFullScreen
      className="h-[400px] w-full rounded-b-2xl border-0"
      loading="lazy"
      referrerPolicy="no-referrer"
      src={safeSource}
      title={title}
    />
  )
}

type MapPlaceholderProps = {
  action?: React.ReactNode
  description: string
  title?: string
}

function MapPlaceholder({action, description, title}: MapPlaceholderProps) {
  return (
    <div className="bg-muted/30 flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
      <MapPinIcon aria-hidden="true" className="text-primary h-9 w-9" />
      <div className="max-w-md space-y-2">
        {title ? <h3 className="font-semibold">{title}</h3> : null}
        <p className="text-muted-foreground text-sm leading-6">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function getSafeGoogleMapsEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value)
    const isGoogleHost =
      url.hostname === 'google.com' || url.hostname.endsWith('.google.com')
    const isEmbedPath =
      url.pathname.startsWith('/maps/embed') ||
      (url.pathname.startsWith('/maps') && url.searchParams.get('output') === 'embed')

    return url.protocol === 'https:' && isGoogleHost && isEmbedPath
      ? url.toString()
      : null
  } catch {
    return null
  }
}
