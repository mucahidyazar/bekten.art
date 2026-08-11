import type {Metadata} from 'next'

import Link from 'next/link'
import {notFound} from 'next/navigation'

import {cache} from 'react'

import {PublicInquiryForm} from '@/components/public-inquiry'
import styles from '@/components/public-site/catalog-layouts.module.css'
import {PublicEditorialImage} from '@/components/public-site/public-editorial-image'
import {ArtworkStructuredData} from '@/components/seo/structured-data'
import {localizedPath} from '@/lib/localized-path'
import {publicEditorialReader} from '@/server/public-editorial'

import {
  editorialMetadata,
  heroMedia,
  parsePublicParams,
  PublicArchiveSection,
  publicRouteCopy,
  secondaryMedia,
} from '../public-route-helpers'

type WorkDetailPageProps = Readonly<{
  params: Promise<{locale: string; slug: string}>
}>

export const dynamic = 'force-dynamic'

const readPublishedWork = cache(
  (...arguments_: Parameters<typeof publicEditorialReader.getWork>) =>
    publicEditorialReader.getWork(...arguments_),
)

async function readWork(params: WorkDetailPageProps['params']) {
  const {locale, slug} = await parsePublicParams(params, {slug: true})
  const work = await readPublishedWork(locale, slug)

  if (!work) return notFound()

  return {locale, work}
}

export async function generateMetadata({
  params,
}: WorkDetailPageProps): Promise<Metadata> {
  const {locale, work} = await readWork(params)

  return editorialMetadata(work.seo, locale)
}

function publicOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bekten.art')
      .origin
  } catch {
    return 'https://bekten.art'
  }
}

export default async function WorkDetailPage({params}: WorkDetailPageProps) {
  const {locale, work} = await readWork(params)
  const copy = publicRouteCopy[locale]
  const media = heroMedia(work)
  const gallery = secondaryMedia(work)
  const factCandidates: readonly Readonly<{
    label: string
    value: number | string | null | undefined
  }>[] = [
    {label: copy.year, value: work.year},
    {label: copy.medium, value: work.medium},
    {label: copy.dimensions, value: work.dimensions},
  ]
  const facts = factCandidates.filter(
    (fact): fact is Readonly<{label: string; value: number | string}> =>
      fact.value !== null && fact.value !== undefined,
  )
  const origin = publicOrigin()

  return (
    <div className={styles.page}>
      {media ? (
        <ArtworkStructuredData
          artMedium={work.medium ?? undefined}
          creator="Bekten Usubaliev"
          dateCreated={work.year?.toString()}
          description={work.description}
          image={new URL(media.url, origin).toString()}
          name={work.title}
          url={new URL(
            localizedPath(locale, work.seo.canonicalPath),
            origin,
          ).toString()}
        />
      ) : null}
      <article>
        <header className={styles.detailHero}>
          <div className={`${styles.sectionInner} ${styles.detailHeroGrid}`}>
            {media ? (
              <figure className={styles.detailMedia}>
                <PublicEditorialImage
                  media={media}
                  priority
                  sizes="(max-width: 768px) 100vw, 55vw"
                />
                {media.caption ? (
                  <figcaption>{media.caption}</figcaption>
                ) : null}
              </figure>
            ) : null}
            <div className={styles.detailCopy}>
              <p className="heritage-kicker">{copy.workArchive}</p>
              <h1>{work.title}</h1>
              <p className={styles.detailDescription}>{work.description}</p>
              {facts.length > 0 ? (
                <aside aria-label={copy.workFacts} className={styles.factsRail}>
                  <dl className={styles.factList}>
                    {facts.map(fact => (
                      <div key={fact.label}>
                        <dt>{fact.label}</dt>
                        <dd>{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                </aside>
              ) : null}
              <Link className="heritage-button" href="#availability-inquiry">
                {copy.availabilityInquiry}
              </Link>
            </div>
          </div>
        </header>
        {gallery.length > 0 ? (
          <PublicArchiveSection labelledBy="work-gallery-title" light>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle} id="work-gallery-title">
                {copy.detailsFromWork}
              </h2>
            </div>
            <div className={styles.galleryGrid}>
              {gallery.map(placement => (
                <figure key={placement.mediaObjectId}>
                  <PublicEditorialImage
                    media={placement}
                    sizes="(max-width: 672px) 50vw, 33vw"
                  />
                  {placement.caption ? (
                    <figcaption>{placement.caption}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </PublicArchiveSection>
        ) : null}
        <div id="availability-inquiry">
          <PublicInquiryForm
            artwork={{
              id: work.id,
              medium: work.medium,
              title: work.title,
              year: work.year,
            }}
            locale={locale}
            type="AVAILABILITY"
          />
        </div>
      </article>
    </div>
  )
}
