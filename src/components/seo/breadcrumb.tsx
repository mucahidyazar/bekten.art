'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

import {ChevronRightIcon, HomeIcon} from 'lucide-react'
import {useTranslations} from 'next-intl'

import {BreadcrumbStructuredData} from './structured-data'

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({items, className = ''}: BreadcrumbProps) {
  const pathname = usePathname()
  const t = useTranslations('navigation')

  // Extract locale from pathname
  const segments = pathname.split('/').filter(Boolean)
  const locale = segments[0] || 'en'
  const pathSegments = segments.slice(1) // Remove locale from segments

  // Generate breadcrumb items if not provided
  const breadcrumbItems: BreadcrumbItem[] =
    items || generateBreadcrumbItems(pathSegments, locale, t)

  if (breadcrumbItems.length <= 1) {
    return null // Don't show breadcrumb for home page only
  }

  const domain =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'https://bekten.art'

  const structuredDataItems = breadcrumbItems.map(item => ({
    name: item.name,
    url: `${domain}${item.url}`,
  }))

  return (
    <div className="container">
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
                  {index === 0 && <HomeIcon className="mr-1 h-4 w-4" />}
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="hover:text-foreground flex items-center transition-colors"
                >
                  {index === 0 && <HomeIcon className="mr-1 h-4 w-4" />}
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

function generateBreadcrumbItems(
  pathSegments: string[],
  locale: string,
  t: any,
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    {
      name: t('home'),
      url: `/${locale}`,
    },
  ]

  let currentPath = `/${locale}`

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Generate human-readable names for segments
    let name = segment

    // Handle known routes
    switch (segment) {
      case 'about':
        name = t('about')
        break
      case 'gallery':
        name = t('gallery')
        break
      case 'news':
        name = t('news')
        break
      case 'contact':
        name = t('contact')
        break
      case 'store':
        name = t('store')
        break
      case 'sign-in':
        name = t('signIn')
        break
      case 'sign-up':
        name = t('signUp')
        break
      case 'profile':
        name = t('profile')
        break
      default:
        // For dynamic segments (like IDs), try to make them more readable
        if (/^\d+$/.test(segment)) {
          // If it's a number, it's likely an ID - use the parent context
          if (pathSegments[index - 1] === 'news') {
            name = t('newsDetail')
          } else if (pathSegments[index - 1] === 'profile') {
            name = t('userProfile')
          } else {
            name = `#${segment}`
          }
        } else {
          // Capitalize and replace hyphens with spaces
          name = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }
    }

    items.push({
      name,
      url: currentPath,
    })
  })

  return items
}
