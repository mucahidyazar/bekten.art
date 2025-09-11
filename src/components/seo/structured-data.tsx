import Script from 'next/script'

interface PersonSchemaProps {
  name: string
  alternateName?: string
  description: string
  url: string
  image: string
  jobTitle: string
  nationality?: string
  birthPlace?: string
  sameAs?: string[]
}

interface OrganizationSchemaProps {
  name: string
  description: string
  url: string
  logo: string
  sameAs?: string[]
  contactPoint?: {
    telephone: string
    contactType: string
  }
}

interface ArtworkSchemaProps {
  name: string
  description: string
  image: string
  creator: string
  dateCreated?: string
  artMedium?: string
  artworkSurface?: string
  url: string
}

export function ArtworkStructuredData({
  name,
  description,
  image,
  creator,
  dateCreated,
  artMedium,
  artworkSurface,
  url,
}: ArtworkSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${url}#artwork`,
    name,
    description,
    image: {
      '@type': 'ImageObject',
      url: image,
    },
    creator: {
      '@type': 'Person',
      name: creator,
    },
    dateCreated,
    artMedium,
    artworkSurface,
    url,
    category: 'Visual Arts',
    genre: 'Contemporary Art',
  }

  return (
    <Script
      id="artwork-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  )
}

export function BreadcrumbStructuredData({
  items,
}: {
  items: Array<{name: string; url: string}>
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <Script
      id="breadcrumb-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  )
}

export function OrganizationStructuredData({
  name,
  description,
  url,
  logo,
  sameAs,
  contactPoint,
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${url}#organization`,
    name,
    description,
    url,
    logo: {
      '@type': 'ImageObject',
      url: logo,
    },
    sameAs,
    contactPoint: contactPoint
      ? {
          '@type': 'ContactPoint',
          telephone: contactPoint.telephone,
          contactType: contactPoint.contactType,
        }
      : undefined,
  }

  return (
    <Script
      id="organization-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  )
}

export function PersonStructuredData({
  name,
  alternateName,
  description,
  url,
  image,
  jobTitle,
  nationality,
  birthPlace,
  sameAs,
}: PersonSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    alternateName,
    description,
    url,
    image,
    jobTitle,
    nationality,
    birthPlace,
    sameAs,
    knowsAbout: [
      'Painting',
      'Contemporary Art',
      'Oil Painting',
      'Portrait Painting',
    ],
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Painter',
      occupationLocation: {
        '@type': 'City',
        name: 'Bishkek',
        addressCountry: 'KG',
      },
    },
  }

  return (
    <Script
      id="person-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  )
}

export function WebsiteStructuredData({
  name,
  description,
  url,
}: {
  name: string
  description: string
  url: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}#website`,
    name,
    description,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Person',
      name: 'Bekten Usubaliev',
      url,
    },
  }

  return (
    <Script
      id="website-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  )
}
