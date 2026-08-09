function serializeStructuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function StructuredDataScript({id, data}: {id: string; data: unknown}) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: serializeStructuredData(data)}}
    />
  )
}

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

  return <StructuredDataScript id="artwork-structured-data" data={schema} />
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

  return <StructuredDataScript id="breadcrumb-structured-data" data={schema} />
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
    <StructuredDataScript id="organization-structured-data" data={schema} />
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

  return <StructuredDataScript id="person-structured-data" data={schema} />
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
    publisher: {
      '@type': 'Person',
      name: 'Bekten Usubaliev',
      url,
    },
  }

  return <StructuredDataScript id="website-structured-data" data={schema} />
}

export {serializeStructuredData}
