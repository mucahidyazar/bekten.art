import {Metadata} from 'next'

import {CallToAction} from '@/components/molecules/call-to-action'
import {NewsSection} from '@/components/sections/news-section'
import {getPublishedNewsArticles} from '@/services'
import {prepareMetadata} from '@/utils/prepare-metadata'

import {PressSection} from './components/press-section'

import type {AppLocale} from '@/lib/localized-path'

type PageProps = Readonly<{params: Promise<{locale: AppLocale}>}>

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params
  const {getTranslations} = await import('next-intl/server')
  const t = await getTranslations({locale, namespace: 'news'})

  return prepareMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    page: 'news',
  })
}

export default async function NewsPage({params}: PageProps) {
  const {locale} = await params
  const news = await getPublishedNewsArticles(locale)

  return (
    <>
      <NewsSection items={news} locale={locale} />
      <section
        aria-labelledby="press-section-title"
        className="app-container py-8"
      >
        <PressSection locale={locale} />
      </section>
      {/* Call to Action */}
      <CallToAction />
    </>
  )
}
