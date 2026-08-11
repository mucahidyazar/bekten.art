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
  PlainTextBody,
  PublicArchiveSection,
  PublicPageIntro,
  publicDate,
  publicRouteCopy,
} from '../../works/public-route-helpers'

type ExhibitionDetailPageProps = Readonly<{
  params: Promise<{locale: string; slug: string}>
}>

export const dynamic = 'force-dynamic'

const readPublishedExhibition = cache(
  (...arguments_: Parameters<typeof publicEditorialReader.getExhibition>) =>
    publicEditorialReader.getExhibition(...arguments_),
)

async function readExhibition(params: ExhibitionDetailPageProps['params']) {
  const {contentLocale, locale, slug} = await parsePublicParams(params, {
    slug: true,
  })
  const detail = await readPublishedExhibition(contentLocale, slug)

  if (!detail) return notFound()

  return {contentLocale, detail, locale}
}

export async function generateMetadata({
  params,
}: ExhibitionDetailPageProps): Promise<Metadata> {
  const {contentLocale, detail, locale} = await readExhibition(params)

  return editorialMetadata(detail.exhibition.seo, locale, contentLocale)
}

export default async function ExhibitionDetailPage({
  params,
}: ExhibitionDetailPageProps) {
  const {contentLocale, detail, locale} = await readExhibition(params)
  const {exhibition, works} = detail
  const media = heroMedia(exhibition)
  const place = [exhibition.venue, exhibition.city, exhibition.country]
    .filter(Boolean)
    .join(' · ')
  const dates = [
    publicDate(exhibition.startsAt, locale),
    exhibition.endsAt ? publicDate(exhibition.endsAt, locale) : null,
  ]
    .filter(Boolean)
    .join(' — ')
  const headingId = 'exhibited-works-title'

  return (
    <div className={styles.page}>
      <article>
        <PublicPageIntro
          intro={exhibition.subtitle ?? exhibition.body}
          kicker={publicRouteCopy[contentLocale].exhibitions.kicker}
          media={media}
          title={exhibition.title}
          transitionKey={exhibition.slug}
        />
        <PublicArchiveSection>
          <div className={styles.articleLayout}>
            <PlainTextBody body={exhibition.body} />
            <aside
              aria-label={publicRouteCopy[contentLocale].exhibitions.kicker}
              className={styles.articleRail}
            >
              <h2>{publicRouteCopy[contentLocale].exhibitions.kicker}</h2>
              {place ? <p>{place}</p> : null}
              <p>{dates}</p>
            </aside>
          </div>
        </PublicArchiveSection>
        <PublicArchiveSection labelledBy={headingId} light>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} id={headingId}>
              {publicRouteCopy[contentLocale].exhibitedWorks}
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
