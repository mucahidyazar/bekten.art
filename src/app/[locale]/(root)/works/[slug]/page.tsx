import type {Metadata} from 'next'

import Link from 'next/link'
import {notFound} from 'next/navigation'

import {cache} from 'react'

import {PublicInquiryForm} from '@/components/public-inquiry'
import styles from '@/components/public-site/catalog-layouts.module.css'
import {PublicContainer} from '@/components/public-site/public-container'
import {
  PublicPageTransition,
  SharedEditorialTransition,
} from '@/components/public-site/public-view-transition'
import {PublicWorkMedia} from '@/components/public-site/public-work-media'
import {ArtworkStructuredData} from '@/components/seo/structured-data'
import {localizedPath} from '@/lib/localized-path'
import {publicEditorialReader} from '@/server/public-editorial'

import {
  editorialMetadata,
  heroMedia,
  parsePublicParams,
  publicRouteCopy,
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
  const {contentLocale, locale, slug} = await parsePublicParams(params, {
    slug: true,
  })
  const work = await readPublishedWork(contentLocale, slug)

  if (!work) return notFound()

  return {contentLocale, locale, work}
}

export async function generateMetadata({
  params,
}: WorkDetailPageProps): Promise<Metadata> {
  const {locale, work} = await readWork(params)

  return editorialMetadata(work.seo, locale, work.locale)
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
  const {contentLocale, work} = await readWork(params)
  const copy = publicRouteCopy[contentLocale]
  const media = heroMedia(work)
  const workMedia = [...work.mediaPlacements].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  )
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
    <PublicPageTransition>
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
              localizedPath(work.locale, work.seo.canonicalPath),
              origin,
            ).toString()}
          />
        ) : null}
        <article lang={work.locale}>
          <header className={styles.detailHero}>
            <div className={`${styles.sectionInner} ${styles.detailHeroGrid}`}>
              {media ? (
                <div className={styles.detailMedia}>
                  <SharedEditorialTransition kind="image" publicKey={work.slug}>
                    <PublicWorkMedia
                      label={`${work.title} artwork`}
                      media={workMedia}
                      nextLabel={copy.nextImage}
                      previousLabel={copy.previousImage}
                    />
                  </SharedEditorialTransition>
                </div>
              ) : null}
              <div className={styles.detailCopy}>
                <p className="heritage-kicker">{copy.workArchive}</p>
                <SharedEditorialTransition kind="title" publicKey={work.slug}>
                  <h1>{work.title}</h1>
                </SharedEditorialTransition>
                <p className={styles.detailDescription}>{work.description}</p>
                {facts.length > 0 ? (
                  <aside
                    aria-label={copy.workFacts}
                    className={styles.factsRail}
                  >
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
          <PublicContainer
            className={styles.detailInquiryContainer}
            id="availability-inquiry"
          >
            <PublicInquiryForm
              artwork={{
                id: work.id,
                medium: work.medium,
                title: work.title,
                year: work.year,
              }}
              locale={contentLocale}
              type="AVAILABILITY"
            />
          </PublicContainer>
        </article>
      </div>
    </PublicPageTransition>
  )
}
