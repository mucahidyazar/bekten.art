import type {Metadata} from 'next'

import styles from '@/components/public-site/catalog-layouts.module.css'
import {PublicArtworkGrid} from '@/components/public-site/public-artwork-grid'
import {publicEditorialReader} from '@/server/public-editorial'

import {
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
  const {locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[locale].availableWorks

  return listMetadata(locale, 'available-works', copy.title, copy.intro)
}

export default async function AvailableWorksPage({
  params,
}: AvailableWorksPageProps) {
  const {locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[locale].availableWorks
  const works = await publicEditorialReader.listAvailableWorks(locale)

  return (
    <div className={styles.page}>
      <PublicPageIntro {...copy} illustration="landscape" />
      <PublicArchiveSection
        accessibleName={publicRouteCopy[locale].availableSelection}
        light
      >
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {publicRouteCopy[locale].availableSelection}
          </h2>
          <p className={styles.sectionCount}>
            {String(works.length).padStart(2, '0')}
          </p>
        </div>
        {works.length > 0 ? (
          <PublicArtworkGrid
            actionLabel={publicRouteCopy[locale].availabilityInquiry}
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
