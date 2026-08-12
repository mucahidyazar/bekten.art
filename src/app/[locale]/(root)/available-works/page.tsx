import type {Metadata} from 'next'

import styles from '@/components/public-site/catalog-layouts.module.css'
import {PublicArtworkGrid} from '@/components/public-site/public-artwork-grid'
import {publicEditorialReader} from '@/server/public-editorial'

import {
  heroMedia,
  listMetadata,
  parsePublicParams,
  PublicArchiveSection,
  PublicPageIntro,
  publicRouteCopy,
} from '../works/public-route-helpers'

type AvailableWorksPageProps = Readonly<{params: Promise<{locale: string}>}>

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: AvailableWorksPageProps): Promise<Metadata> {
  const {contentLocale, locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[contentLocale].availableWorks

  return listMetadata(locale, 'available-works', copy.title, copy.intro)
}

export default async function AvailableWorksPage({
  params,
}: AvailableWorksPageProps) {
  const {contentLocale, locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[contentLocale].availableWorks
  const works = await publicEditorialReader.listAvailableWorks(contentLocale)

  return (
    <div className={styles.page}>
      <PublicPageIntro {...copy} media={works[0] ? heroMedia(works[0]) : undefined} />
      <PublicArchiveSection
        accessibleName={publicRouteCopy[contentLocale].availableSelection}
        light
      >
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {publicRouteCopy[contentLocale].availableSelection}
          </h2>
          <p className={styles.sectionCount}>
            {String(works.length).padStart(2, '0')}
          </p>
        </div>
        {works.length > 0 ? (
          <PublicArtworkGrid
            actionLabel={publicRouteCopy[contentLocale].availabilityInquiry}
            locale={locale}
            priorityFirst
            works={works}
          />
        ) : (
          <p role="status">{copy.empty}</p>
        )}
      </PublicArchiveSection>
    </div>
  )
}
