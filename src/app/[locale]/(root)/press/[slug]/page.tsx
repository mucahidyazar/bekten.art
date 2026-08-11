import type {Metadata} from 'next'

import {notFound} from 'next/navigation'

import {cache} from 'react'

import styles from '@/components/public-site/catalog-layouts.module.css'
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

type PressDetailPageProps = Readonly<{
  params: Promise<{locale: string; slug: string}>
}>

export const dynamic = 'force-dynamic'

const readPublishedPressEntry = cache(
  (...arguments_: Parameters<typeof publicEditorialReader.getPressEntry>) =>
    publicEditorialReader.getPressEntry(...arguments_),
)

async function readPressEntry(params: PressDetailPageProps['params']) {
  const {contentLocale, locale, slug} = await parsePublicParams(params, {
    slug: true,
  })
  const entry = await readPublishedPressEntry(contentLocale, slug)

  if (!entry) return notFound()

  return {contentLocale, entry, locale}
}

export async function generateMetadata({
  params,
}: PressDetailPageProps): Promise<Metadata> {
  const {contentLocale, entry, locale} = await readPressEntry(params)

  return editorialMetadata(entry.seo, locale, contentLocale)
}

export default async function PressDetailPage({params}: PressDetailPageProps) {
  const {contentLocale, entry, locale} = await readPressEntry(params)
  const media = heroMedia(entry)
  const publication = [
    entry.outlet,
    entry.publishedOn ? publicDate(entry.publishedOn, locale) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className={styles.page}>
      <article>
        <PublicPageIntro
          intro={entry.subtitle ?? entry.excerpt}
          kicker={publication}
          media={media}
          title={entry.title}
          transitionKey={entry.slug}
        />
        <PublicArchiveSection>
          <div className={styles.articleLayout}>
            <PlainTextBody body={entry.body ?? entry.excerpt} />
            <aside
              aria-label={publicRouteCopy[contentLocale].publicationDetails}
              className={styles.articleRail}
            >
              <h2>{publicRouteCopy[contentLocale].publicationDetails}</h2>
              <p>{entry.outlet}</p>
              {entry.publishedOn ? (
                <p>{publicDate(entry.publishedOn, locale)}</p>
              ) : null}
              <a
                className="heritage-text-link"
                href={entry.sourceUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {publicRouteCopy[contentLocale].readAtSource}
              </a>
            </aside>
          </div>
        </PublicArchiveSection>
      </article>
    </div>
  )
}
