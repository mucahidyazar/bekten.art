import {headers} from 'next/headers'
import Link from 'next/link'

import {ChevronRightIcon, HomeIcon} from 'lucide-react'
import {getTranslations} from 'next-intl/server'

import {APP_LOCALES, type AppLocale, localizedPath} from '@/lib/localized-path'

import {BreadcrumbStructuredData} from './structured-data'

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

type BreadcrumbTranslator = (key: string) => string

function getBreadcrumbName(
  segment: string,
  parentSegment: string | undefined,
  translate: BreadcrumbTranslator,
) {
  const translationKeys: Record<string, string> = {
    about: 'about',
    gallery: 'gallery',
    news: 'news',
    contact: 'contact',
    store: 'store',
    'sign-in': 'signIn',
    'sign-up': 'signUp',
    'forgot-password': 'forgotPassword',
    'reset-password': 'resetPassword',
    profile: 'profile',
  }

  if (translationKeys[segment]) {
    return translate(translationKeys[segment])
  }

  if (parentSegment === 'news') {
    return translate('newsDetail')
  }

  if (parentSegment === 'profile') {
    return translate('userProfile')
  }

  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function buildBreadcrumbItems(
  pathname: string,
  translate: BreadcrumbTranslator,
): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const routeLocale = segments[0]
  const isSupportedLocale = APP_LOCALES.includes(routeLocale as AppLocale)
  const isLegacyKyrgyzLocale = routeLocale === 'kg'
  const locale = isSupportedLocale
    ? (routeLocale as AppLocale)
    : isLegacyKyrgyzLocale
      ? 'ky'
      : 'en'
  const pathSegments =
    isSupportedLocale || isLegacyKyrgyzLocale ? segments.slice(1) : segments
  const items: BreadcrumbItem[] = [
    {name: translate('home'), url: localizedPath(locale, '/')},
  ]

  pathSegments.forEach((segment, index) => {
    const publicPath = `/${pathSegments.slice(0, index + 1).join('/')}`

    items.push({
      name: getBreadcrumbName(segment, pathSegments[index - 1], translate),
      url: localizedPath(locale, publicPath),
    })
  })

  return items
}

export async function Breadcrumb({items, className = ''}: BreadcrumbProps) {
  const pathname = (await headers()).get('x-pathname') ?? '/'
  const routeLocale = pathname.split('/').filter(Boolean)[0]
  const locale = APP_LOCALES.includes(routeLocale as AppLocale)
    ? (routeLocale as AppLocale)
    : 'en'
  const t = await getTranslations({locale, namespace: 'navigation'})
  const breadcrumbItems =
    items || buildBreadcrumbItems(pathname, key => t(key as never))

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
