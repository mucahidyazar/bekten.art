import {headers} from 'next/headers'
import Link from 'next/link'

import {ChevronRightIcon, HomeIcon} from 'lucide-react'

import {
  publicLocale,
  publicShellCopy,
  type PublicLocale,
} from '@/components/public-site/public-copy'
import {APP_LOCALES, type AppLocale, localizedPath} from '@/lib/localized-path'

import {BreadcrumbStructuredData} from './structured-data'

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
  showNavigation?: boolean
}

const EXTRA_LABELS: Readonly<
  Record<PublicLocale, Readonly<Record<string, string>>>
> = Object.freeze({
  en: {
    'available-works': 'Available works',
    archive: 'Archive',
    artist: 'Artist & studio',
    collectors: 'Collectors',
    'commission-a-work': 'Commission a work',
    'privacy-policy': 'Privacy policy',
    studio: 'Studio',
    'terms-of-service': 'Terms of service',
  },
  ky: {
    'available-works': 'Жеткиликтүү эмгектер',
    archive: 'Архив',
    artist: 'Сүрөтчү жана студия',
    collectors: 'Коллекционерлер',
    'commission-a-work': 'Эмгекке буйрутма берүү',
    'privacy-policy': 'Купуялык саясаты',
    studio: 'Студия',
    'terms-of-service': 'Колдонуу шарттары',
  },
  ru: {
    'available-works': 'Доступные работы',
    archive: 'Архив',
    artist: 'Художник и студия',
    collectors: 'Коллекционерам',
    'commission-a-work': 'Заказать работу',
    'privacy-policy': 'Политика конфиденциальности',
    studio: 'Студия',
    'terms-of-service': 'Условия использования',
  },
  tr: {
    'available-works': 'Uygun eserler',
    archive: 'Arşiv',
    artist: 'Sanatçı ve stüdyo',
    collectors: 'Koleksiyonerler',
    'commission-a-work': 'Özel eser talebi',
    'privacy-policy': 'Gizlilik politikası',
    studio: 'Stüdyo',
    'terms-of-service': 'Kullanım koşulları',
  },
})

function staticLabels(locale: PublicLocale): Readonly<Record<string, string>> {
  const copy = publicShellCopy[locale]

  return Object.freeze({
    ...EXTRA_LABELS[locale],
    collections: copy.collections,
    contact: copy.contact,
    exhibitions: copy.exhibitions,
    journal: copy.journal,
    press: copy.press,
    'private-viewings': copy.privateViewing,
    works: copy.works,
  })
}

function readableSegment(segment: string) {
  let decoded = segment

  try {
    decoded = decodeURIComponent(segment)
  } catch {
    // Keep the original route segment when it contains malformed encoding.
  }

  return decoded
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toLocaleUpperCase() + word.slice(1))
    .join(' ')
}

function routeLocale(pathname: string) {
  const segment = pathname.split('/').filter(Boolean)[0]

  if (segment === 'kg') return 'ky' as const

  return publicLocale(segment)
}

function buildBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const locale = routeLocale(pathname)
  const firstSegment = segments[0]
  const hasLocale =
    APP_LOCALES.includes(firstSegment as AppLocale) || firstSegment === 'kg'
  const pathSegments = hasLocale ? segments.slice(1) : segments
  const labels = staticLabels(locale)
  const items: BreadcrumbItem[] = [
    {name: publicShellCopy[locale].home, url: localizedPath(locale, '/')},
  ]

  pathSegments.forEach((segment, index) => {
    const publicPath = `/${pathSegments.slice(0, index + 1).join('/')}`

    items.push({
      name: labels[segment] ?? readableSegment(segment),
      url: localizedPath(locale, publicPath),
    })
  })

  return items
}

export async function Breadcrumb({
  items,
  className = '',
  showNavigation = true,
}: BreadcrumbProps) {
  const pathname = (await headers()).get('x-pathname') ?? '/'
  const breadcrumbItems = items || buildBreadcrumbItems(pathname)

  if (breadcrumbItems.length <= 1) {
    return null
  }

  const domain = new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://bekten.art',
  ).origin
  const structuredDataItems = breadcrumbItems.map(item => ({
    name: item.name,
    url: `${domain}${item.url}`,
  }))

  if (!showNavigation) {
    return <BreadcrumbStructuredData items={structuredDataItems} />
  }

  return (
    <div className="app-container">
      <BreadcrumbStructuredData items={structuredDataItems} />
      <nav aria-label="Breadcrumb" className={`mb-8 ${className}`}>
        <ol className="text-muted-foreground flex items-center space-x-2 text-sm">
          {breadcrumbItems.map((item, index) => (
            <li key={item.url} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon className="mx-2 h-4 w-4" aria-hidden="true" />
              )}
              {index === breadcrumbItems.length - 1 ? (
                <span
                  className="text-foreground flex items-center font-medium"
                  aria-current="page"
                >
                  {index === 0 && (
                    <HomeIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                  )}
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="hover:text-foreground flex items-center transition-colors"
                >
                  {index === 0 && (
                    <HomeIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                  )}
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}

export {buildBreadcrumbItems}
