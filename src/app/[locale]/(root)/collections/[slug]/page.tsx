import type {Metadata} from 'next'

import {notFound} from 'next/navigation'

import {cache} from 'react'

import styles from '@/components/public-site/catalog-layouts.module.css'
import {PublicArtworkGrid} from '@/components/public-site/public-artwork-grid'
import {publicEditorialReader} from '@/server/public-editorial'

import {
  editorialMetadata,
  heroMedia,
  parsePublicParams,
  PublicArchiveSection,
  PublicPageIntro,
  publicRouteCopy,
} from '../../works/public-route-helpers'

type CollectionDetailPageProps = Readonly<{
  params: Promise<{locale: string; slug: string}>
}>

export const dynamic = 'force-dynamic'

const readPublishedCollection = cache(
  (...arguments_: Parameters<typeof publicEditorialReader.getCollection>) =>
    publicEditorialReader.getCollection(...arguments_),
)

async function readCollection(params: CollectionDetailPageProps['params']) {
  const {locale, slug} = await parsePublicParams(params, {slug: true})
  const detail = await readPublishedCollection(locale, slug)

  if (!detail) return notFound()

  return {detail, locale}
}

export async function generateMetadata({
  params,
}: CollectionDetailPageProps): Promise<Metadata> {
  const {detail, locale} = await readCollection(params)

  return editorialMetadata(detail.collection.seo, locale)
}

export default async function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const {detail, locale} = await readCollection(params)
  const {collection, works} = detail
  const media = heroMedia(collection)
  const headingId = 'collection-works-title'

  return (
    <div className={styles.page}>
      <article>
        <PublicPageIntro
          intro={collection.description}
          kicker={publicRouteCopy[locale].collections.kicker}
          media={media}
          title={collection.title}
        />
        <section
          aria-label={publicRouteCopy[locale].collectionNote}
          className={styles.collectionNote}
        >
          <div className={styles.sectionInner}>
            <p>{collection.description}</p>
          </div>
        </section>
        <PublicArchiveSection labelledBy={headingId} light>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} id={headingId}>
              {publicRouteCopy[locale].collectionWorks}
            </h2>
            <p className={styles.sectionCount}>
              {String(works.length).padStart(2, '0')}
            </p>
          </div>
          {works.length > 0 ? (
            <PublicArtworkGrid locale={locale} works={works} />
          ) : (
            <p role="status">{publicRouteCopy[locale].works.empty}</p>
          )}
        </PublicArchiveSection>
      </article>
    </div>
  )
}
