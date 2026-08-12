import type {Metadata} from 'next'

import styles from '@/components/public-site/catalog-layouts.module.css'
import {PublicEditorialCard} from '@/components/public-site/public-editorial-card'
import {localizedPath} from '@/lib/localized-path'
import {publicEditorialReader} from '@/server/public-editorial'

import {
  heroMedia,
  listMetadata,
  parsePublicParams,
  PublicArchiveSection,
  PublicEditorialList,
  PublicPageIntro,
  publicDate,
  publicRouteCopy,
} from '../works/public-route-helpers'

type JournalPageProps = Readonly<{params: Promise<{locale: string}>}>

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: JournalPageProps): Promise<Metadata> {
  const {contentLocale, locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[contentLocale].journal

  return listMetadata(locale, 'journal', copy.title, copy.intro)
}

export default async function JournalPage({params}: JournalPageProps) {
  const {contentLocale, locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[contentLocale].journal
  const entries = await publicEditorialReader.listJournalEntries(contentLocale)
  const [featured, ...archive] = entries

  const journalItem = (entry: (typeof entries)[number]) => ({
    contentLocale: entry.locale,
    description: entry.excerpt,
    eyebrow: publicDate(entry.publishedAt, locale),
    href: localizedPath(locale, `/journal/${entry.slug}`),
    id: entry.id,
    media: heroMedia(entry),
    publicKey: entry.slug,
    title: entry.title,
  })

  return (
    <div className={styles.page}>
      <PublicPageIntro {...copy} media={featured ? heroMedia(featured) : undefined} />
      <PublicArchiveSection light>
        {featured ? (
          <>
            <section
              aria-label={publicRouteCopy[contentLocale].featuredJournalEntry}
              className={styles.featuredRegion}
            >
              <PublicEditorialCard
                actionLabel={publicRouteCopy[contentLocale].readJournal}
                contentLocale={featured.locale}
                description={featured.excerpt}
                eyebrow={publicDate(featured.publishedAt, locale)}
                href={localizedPath(locale, `/journal/${featured.slug}`)}
                media={heroMedia(featured)}
                publicKey={featured.slug}
                title={featured.title}
                variant="featured"
              />
            </section>
            {archive.length > 0 ? (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {publicRouteCopy[contentLocale].journalArchive}
                  </h2>
                </div>
                <PublicEditorialList
                  accessibleName={publicRouteCopy[contentLocale].journalArchive}
                  actionLabel={publicRouteCopy[contentLocale].readJournal}
                  empty={copy.empty}
                  items={archive.map(journalItem)}
                  variant="rows"
                />
              </div>
            ) : null}
          </>
        ) : (
          <p role="status">{copy.empty}</p>
        )}
      </PublicArchiveSection>
    </div>
  )
}
