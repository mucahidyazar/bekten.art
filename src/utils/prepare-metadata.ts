import {Metadata} from 'next'

import {ME} from '@/constants'

type TPrepareMetadata = Metadata & {
  title?: string
  description?: string
  page?: string
}
export function prepareMetadata(metadata: TPrepareMetadata = {}): Metadata {
  // Get domain from environment variables
  const domain =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://bekten.art')

  const DEFAULT_TITLE = {
    default: 'Bekten Usubaliev - Contemporary Oil Painter | Kyrgyz Artist',
    template: `%s | Bekten Usubaliev - Contemporary Artist`,
  }
  const title = metadata.title || DEFAULT_TITLE
  const description = metadata.description || ME.descriptionFull

  const {authors, openGraph, twitter, keywords, ...rest} = metadata

  const imagesUrl = new URL(`${domain}/api/og`)

  if (metadata.title) {
    imagesUrl.searchParams.set('title', metadata.title)
  }
  if (metadata.description) {
    imagesUrl.searchParams.set('description', metadata.description)
  }
  if (metadata.page) {
    imagesUrl.searchParams.set('page', metadata.page)
  }
  const images = imagesUrl.toString()

  // SEO Keywords for art and painting
  const defaultKeywords = [
    'Bekten Usubaliev',
    'contemporary artist',
    'oil painting',
    'Kyrgyz artist',
    'portrait painter',
    'art gallery',
    'contemporary art',
    'Bishkek artist',
    'Central Asian art',
    'modern painting',
    'fine art',
    'artist portfolio',
    'painting workshop',
    'art exhibition',
    'cultural art',
  ]

  const initialMetadata = {
    title,
    description,
    keywords: keywords || defaultKeywords.join(', '),
    authors: [{name: 'Bekten Usubaliev', url: `${domain}`}],
    creator: 'Bekten Usubaliev',
    publisher: 'Bekten Usubaliev',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    manifest: '/site.webmanifest',
    alternates: {
      canonical: '/',
      languages: {
        'en-US': '/en',
        'tr-TR': '/tr',
        'ky-KG': '/kg',
        'ru-RU': '/ru',
      },
    },
    metadataBase: new URL(`${domain}`),
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_US',
      siteName: 'Bekten Usubaliev - Contemporary Artist',
      images: [
        {
          url: images,
          width: 1200,
          height: 630,
          alt: 'Bekten Usubaliev - Contemporary Oil Painter',
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
          url: images,
          alt: 'Bekten Usubaliev - Contemporary Oil Painter',
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
