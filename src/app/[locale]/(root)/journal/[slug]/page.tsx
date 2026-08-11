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

type JournalDetailPageProps = Readonly<{
  params: Promise<{locale: string; slug: string}>
}>

export const dynamic = 'force-dynamic'

const readPublishedJournalEntry = cache(
  (...arguments_: Parameters<typeof publicEditorialReader.getJournalEntry>) =>
    publicEditorialReader.getJournalEntry(...arguments_),
)

async function readJournalEntry(params: JournalDetailPageProps['params']) {
  const {locale, slug} = await parsePublicParams(params, {slug: true})
  const entry = await readPublishedJournalEntry(locale, slug)

  if (!entry) return notFound()

  return {entry, locale}
}

export async function generateMetadata({
  params,
}: JournalDetailPageProps): Promise<Metadata> {
  const {entry, locale} = await readJournalEntry(params)

  return editorialMetadata(entry.seo, locale)
}

export default async function JournalDetailPage({
  params,
}: JournalDetailPageProps) {
  const {entry, locale} = await readJournalEntry(params)
  const media = heroMedia(entry)

  return (
    <div className={styles.page}>
      <article>
        <PublicPageIntro
          intro={entry.excerpt}
          kicker={`${publicRouteCopy[locale].journal.kicker} · ${publicDate(entry.publishedAt, locale)}`}
          media={media}
          title={entry.title}
        />
        <PublicArchiveSection>
          <div className={styles.articleLayout}>
            <PlainTextBody body={entry.body} />
            <aside
              aria-label={publicRouteCopy[locale].articleDetails}
              className={styles.articleRail}
            >
              <h2>{publicRouteCopy[locale].articleDetails}</h2>
              <p>{publicDate(entry.publishedAt, locale)}</p>
              <p>{entry.excerpt}</p>
              {media?.caption ? <p>{media.caption}</p> : null}
            </aside>
          </div>
        </PublicArchiveSection>
      </article>
    </div>
  )
}
