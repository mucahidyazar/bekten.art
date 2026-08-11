import type {Metadata} from 'next'

import {getSiteIdentity, SITE_NAME} from '@/components/seo/site-identity'
import {
  APP_LOCALES,
  type AppLocale,
  type BuiltInAppLocale,
} from '@/lib/localized-path'

type TPrepareMetadata = Metadata & {
  contentLocale?: AppLocale
  title?: string
  description?: string
  page?: string
}
export function prepareMetadata(metadata: TPrepareMetadata = {}): Metadata {
  // Get domain from environment variables
  const domain = new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://bekten.art'),
  ).origin

  const {
    authors,
    contentLocale = 'en',
    keywords,
    openGraph,
    page,
    twitter,
    ...rest
  } = metadata
  const identity = getSiteIdentity(contentLocale)
  const OPEN_GRAPH_LOCALE: Readonly<Record<BuiltInAppLocale, string>> = {
    en: 'en_US',
    ky: 'ky_KG',
    ru: 'ru_RU',
    tr: 'tr_TR',
  }
  const identityLocale = APP_LOCALES.includes(
    contentLocale as BuiltInAppLocale,
  )
    ? (contentLocale as BuiltInAppLocale)
    : 'en'
  const DEFAULT_TITLE = {
    default: SITE_NAME,
    template: `%s | Bekten Usubaliev`,
  }
  const title = metadata.title || DEFAULT_TITLE
  const description = metadata.description || identity.siteDescription

  const imagesUrl = new URL(`${domain}/api/og`)

  if (metadata.title) {
    imagesUrl.searchParams.set('title', metadata.title)
  }
  if (metadata.description) {
    imagesUrl.searchParams.set('description', metadata.description)
  }
  if (page) {
    imagesUrl.searchParams.set('page', page)
  }
  const dynamicImage = imagesUrl.toString()

  // Static fallback image for WhatsApp and other platforms that don't support dynamic OG images
  const staticImage = `${domain}/link-preview.jpg`

  const defaultKeywords = [
    'Bekten Usubaliev',
    'contemporary artist',
    'Kyrgyz artist',
    'artist archive',
    'art exhibitions',
    'Central Asian art',
    'Kyrgyzstan art',
  ]

  const initialMetadata = {
    title,
    description,
    keywords: keywords || defaultKeywords,
    authors: [{name: 'Bekten Usubaliev', url: `${domain}`}],
    creator: 'Bekten Usubaliev',
    publisher: 'Bekten Usubaliev',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    manifest: '/site.webmanifest',
    // Canonical and hreflang tags are route-aware and emitted once by the
    // localized root layout. A global `/` canonical would conflict on every
    // localized child page.
    metadataBase: new URL(domain),
    openGraph: {
      title,
      description,
      type: 'website',
      alternateLocale: APP_LOCALES.filter(
        locale => locale !== identityLocale,
      ).map(locale => OPEN_GRAPH_LOCALE[locale]),
      locale: OPEN_GRAPH_LOCALE[identityLocale],
      siteName: SITE_NAME,
      images: [
        {
          url: dynamicImage,
          width: 1200,
          height: 630,
          alt: 'Bekten Usubaliev editorial archive',
        },
        {
          url: staticImage,
          width: 1200,
          height: 630,
          alt: 'Bekten Usubaliev editorial archive',
        },
      ],
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
      site: '@bektenusubaliev',
      creator: '@bektenusubaliev',
      images: [
        {
          url: dynamicImage,
          alt: 'Bekten Usubaliev editorial archive',
        },
        {
          url: staticImage,
          alt: 'Bekten Usubaliev editorial archive',
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-snippet': -1,
        'max-image-preview': 'large' as const,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    category: 'Art & Culture',
    // Additional meta tags for better social media support
    other: {
      // WhatsApp specific meta tags
      'og:image:secure_url': staticImage,
      'og:image:type': 'image/jpeg',
      'og:image:width': '1200',
      'og:image:height': '630',
      // Additional fallback for various platforms
      'twitter:image:src': staticImage,
      // Telegram specific
      'tg:image': staticImage,
    },
  }

  return {
    ...initialMetadata,
    ...rest,
    authors: [
      ...initialMetadata.authors,
      ...(authors ? (Array.isArray(authors) ? authors : [authors]) : []),
    ],
    openGraph: {
      ...initialMetadata.openGraph,
      ...openGraph,
    },
    twitter: {
      ...initialMetadata.twitter,
      ...twitter,
    },
  }
}
