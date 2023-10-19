import { Metadata } from "next"

import { ME_DESCRIPTION } from "@/constants"

type TPrepareMetadata = Metadata & {
  title?: string
  description?: string
  page?: string
}
export function prepareMetadata(metadata: TPrepareMetadata = {}): Metadata {
  const DEFAULT_TITLE = {
    default: 'Bekten Usubaliev',
    template: '%s - Painter | bekten.art',
  }
  const title = metadata.title || DEFAULT_TITLE
  const description = metadata.description || ME_DESCRIPTION

  const { authors, openGraph, twitter, ...rest } = metadata

  const imagesUrl = new URL('https://bekten.art/api/og')
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

  const initialMetadata = {
    title,
    description,
    viewport: 'width=device-width, initial-scale=1',
    authors: [{ name: 'Bekten Usubaliev', url: 'https://bekten.art' }],
    icons: { icon: '/favicon-32x32.png', apple: '/apple-touch-icon.png' },
    manifest: '/site.webmanifest',
    themeColor: '#ffffff',
    alternates: {
      canonical: '/',
      languages: {
        'en-US': '/en',
        'tr-TR': '/tr'
      },
    },
    metadataBase: new URL('https://bekten.art'),
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_US',
      images,
    },
    twitter: {
      title,
      description,
      card: 'summary',
      site: 'https://bekten.art',
      creator: 'Bekten Usubaliev',
      siteId: 'bekten.art',
      creatorId: 'bektenusubaliev',
      images,
    },
    robots: {
      index: true,
      follow: true,
      nocache: true,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: true,
        'max-video-preview': -1,
        'max-snippet': -1,
      },
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