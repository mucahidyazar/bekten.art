import {notFound} from 'next/navigation'

import {PublicInquiryForm} from '@/components/public-inquiry'
import {isSafeLocaleCode, localizedPath} from '@/lib/localized-path'
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

import type {PublicLocale} from './public-copy'
import type {PublicInquiryType} from '@/components/public-inquiry'
import type {PublicPage} from '@/server/public-editorial'

type ManagedPageRouteProps = Readonly<{
  params: Promise<{locale: string}>
}>

type ManagedPageRouteOptions = Readonly<{
  inquiryType?: Extract<
    PublicInquiryType,
    'COLLECTOR' | 'COMMISSION' | 'GENERAL' | 'PRIVATE_VIEWING'
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
    if (!isSafeLocaleCode(locale)) return null

    const uiLocale = isPublicLocale(locale) ? locale : 'en'
    const page = await publicEditorialReader.getPage(uiLocale, slug)

    return page
      ? Object.freeze({contentLocale: page.locale, page, uiLocale})
      : null
  }

  async function generateMetadata({params}: ManagedPageRouteProps) {
    const {locale} = await params
    const resolved = await findPage(locale)

    if (!resolved) notFound()

    const {contentLocale, page} = resolved
    const usesFallback = contentLocale !== locale

    return prepareMetadata({
      alternates: {
        canonical: localizedPath(contentLocale, page.seo.canonicalPath),
      },
      contentLocale,
      description: page.seo.description,
      robots: {
        follow: !page.seo.noIndex,
        index: !page.seo.noIndex && !usesFallback,
      },
      title: page.seo.title,
    })
  }

  async function Page({params}: ManagedPageRouteProps) {
    const {locale} = await params
    const resolved = await findPage(locale)

    if (!resolved) notFound()

    const {contentLocale, page, uiLocale} = resolved

    const inquiry = inquiryType ? (
      <PublicInquiryForm locale={uiLocale} type={inquiryType} />
    ) : null

    return (
      <div lang={contentLocale}>
        {managedPageComposition(kind, uiLocale, page, inquiry)}
      </div>
    )
  }

  return Object.freeze({generateMetadata, Page})
}
