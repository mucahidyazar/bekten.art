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
  const {locale, slug} = await parsePublicParams(params, {slug: true})
  const detail = await readPublishedExhibition(locale, slug)

  if (!detail) return notFound()

  return {detail, locale}
}

export async function generateMetadata({
  params,
}: ExhibitionDetailPageProps): Promise<Metadata> {
  const {detail, locale} = await readExhibition(params)

  return editorialMetadata(detail.exhibition.seo, locale)
}

export default async function ExhibitionDetailPage({
  params,
}: ExhibitionDetailPageProps) {
  const {detail, locale} = await readExhibition(params)
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
          kicker={publicRouteCopy[locale].exhibitions.kicker}
          media={media}
          title={exhibition.title}
        />
        <PublicArchiveSection>
          <div className={styles.articleLayout}>
            <PlainTextBody body={exhibition.body} />
            <aside
              aria-label={publicRouteCopy[locale].exhibitions.kicker}
              className={styles.articleRail}
            >
              <h2>{publicRouteCopy[locale].exhibitions.kicker}</h2>
              {place ? <p>{place}</p> : null}
              <p>{dates}</p>
            </aside>
          </div>
        </PublicArchiveSection>
        <PublicArchiveSection labelledBy={headingId} light>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} id={headingId}>
              {publicRouteCopy[locale].exhibitedWorks}
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
