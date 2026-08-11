import type {Metadata} from 'next'

import styles from '@/components/public-site/catalog-layouts.module.css'
import {PublicArtworkGrid} from '@/components/public-site/public-artwork-grid'
import {PublicPageTransition} from '@/components/public-site/public-view-transition'
import {publicEditorialReader} from '@/server/public-editorial'

import {
  listMetadata,
  parsePublicParams,
  PublicArchiveSection,
  PublicPageIntro,
  publicRouteCopy,
} from './public-route-helpers'

type WorksPageProps = Readonly<{params: Promise<{locale: string}>}>

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: WorksPageProps): Promise<Metadata> {
  const {contentLocale, locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[contentLocale].works

  return listMetadata(locale, 'works', copy.title, copy.intro)
}

export default async function WorksPage({params}: WorksPageProps) {
  const {contentLocale, locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[contentLocale].works
  const works = await publicEditorialReader.listWorks(contentLocale)

  return (
    <PublicPageTransition>
      <div className={styles.page}>
        <PublicPageIntro {...copy} illustration="landscape" />
        <PublicArchiveSection
          accessibleName={publicRouteCopy[contentLocale].workArchive}
          light
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {publicRouteCopy[contentLocale].workArchive}
            </h2>
            <p className={styles.sectionCount}>
              {String(works.length).padStart(2, '0')}
            </p>
          </div>
          {works.length > 0 ? (
            <PublicArtworkGrid locale={locale} priorityFirst works={works} />
          ) : (
            <p role="status">{copy.empty}</p>
          )}
        </PublicArchiveSection>
      </div>
    </PublicPageTransition>
  )
}
