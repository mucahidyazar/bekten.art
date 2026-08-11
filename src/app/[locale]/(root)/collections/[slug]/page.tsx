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
  const {contentLocale, locale, slug} = await parsePublicParams(params, {
    slug: true,
  })
  const detail = await readPublishedCollection(contentLocale, slug)

  if (!detail) return notFound()

  return {contentLocale, detail, locale}
}

export async function generateMetadata({
  params,
}: CollectionDetailPageProps): Promise<Metadata> {
  const {contentLocale, detail, locale} = await readCollection(params)

  return editorialMetadata(detail.collection.seo, locale, contentLocale)
}

export default async function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const {contentLocale, detail, locale} = await readCollection(params)
  const {collection, works} = detail
  const media = heroMedia(collection)
  const headingId = 'collection-works-title'

  return (
    <div className={styles.page}>
      <article>
        <PublicPageIntro
          intro={collection.description}
          kicker={publicRouteCopy[contentLocale].collections.kicker}
          media={media}
          title={collection.title}
          transitionKey={collection.slug}
        />
        <section
          aria-label={publicRouteCopy[contentLocale].collectionNote}
          className={styles.collectionNote}
        >
          <div className={styles.sectionInner}>
            <p>{collection.description}</p>
          </div>
        </section>
        <PublicArchiveSection labelledBy={headingId} light>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} id={headingId}>
              {publicRouteCopy[contentLocale].collectionWorks}
            </h2>
            <p className={styles.sectionCount}>
              {String(works.length).padStart(2, '0')}
            </p>
          </div>
          {works.length > 0 ? (
            <PublicArtworkGrid locale={locale} works={works} />
          ) : (
            <p role="status">{publicRouteCopy[contentLocale].works.empty}</p>
          )}
        </PublicArchiveSection>
      </article>
    </div>
  )
}
