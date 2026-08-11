import {notFound} from 'next/navigation'

import {PublicInquiryForm} from '@/components/public-inquiry'
import {localizedPath} from '@/lib/localized-path'
import {publicEditorialReader} from '@/server/public-editorial'
import {prepareMetadata} from '@/utils/prepare-metadata'

import {isPublicLocale} from './public-copy'
import {
  PublicArtistPage,
  PublicCollectorsPage,
  PublicCommissionPage,
  PublicPrivateViewingsPage,
  PublicStudioPage,
} from './public-managed-pages'

import type {PublicInquiryType} from '@/components/public-inquiry'
import type {PublicLocale} from './public-copy'
import type {PublicPage} from '@/server/public-editorial'

type ManagedPageRouteProps = Readonly<{
  params: Promise<{locale: string}>
}>

type ManagedPageRouteOptions = Readonly<{
  inquiryType?: Extract<
    PublicInquiryType,
    'COMMISSION' | 'GENERAL' | 'PRIVATE_VIEWING'
  >
  kind: 'artist' | 'collectors' | 'commission' | 'private-viewings' | 'studio'
  slug: string
}>

function managedPageComposition(
  kind: ManagedPageRouteOptions['kind'],
  locale: PublicLocale,
  page: PublicPage,
  inquiry: React.ReactNode,
) {
  switch (kind) {
    case 'artist':
      return <PublicArtistPage locale={locale} page={page} />
    case 'collectors':
      return (
        <PublicCollectorsPage inquiry={inquiry} locale={locale} page={page} />
      )
    case 'commission':
      return (
        <PublicCommissionPage inquiry={inquiry} locale={locale} page={page} />
      )
    case 'private-viewings':
      return (
        <PublicPrivateViewingsPage
          inquiry={inquiry}
          locale={locale}
          page={page}
        />
      )
    case 'studio':
      return <PublicStudioPage locale={locale} page={page} />
  }
}

export function createPublicManagedRoute({
  inquiryType,
  kind,
  slug,
}: ManagedPageRouteOptions) {
  async function findPage(locale: string) {
    if (!isPublicLocale(locale)) return null

    return publicEditorialReader.getPage(locale, slug)
  }

  async function generateMetadata({params}: ManagedPageRouteProps) {
    const {locale} = await params
    const page = await findPage(locale)

    if (!page || !isPublicLocale(locale)) notFound()

    return prepareMetadata({
      alternates: {
        canonical: localizedPath(locale, page.seo.canonicalPath),
      },
      contentLocale: locale,
      description: page.seo.description,
      robots: {follow: !page.seo.noIndex, index: !page.seo.noIndex},
      title: page.seo.title,
    })
  }

  async function Page({params}: ManagedPageRouteProps) {
    const {locale} = await params
    const page = await findPage(locale)

    if (!page || !isPublicLocale(locale)) notFound()

    const inquiry = inquiryType ? (
      <PublicInquiryForm locale={locale} type={inquiryType} />
    ) : null

    return managedPageComposition(
      kind,
      locale,
      page,
      inquiry,
    )
  }

  return Object.freeze({generateMetadata, Page})
}
