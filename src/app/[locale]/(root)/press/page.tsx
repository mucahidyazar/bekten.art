import type {Metadata} from 'next'

import styles from '@/components/public-site/catalog-layouts.module.css'
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

type PressPageProps = Readonly<{params: Promise<{locale: string}>}>

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: PressPageProps): Promise<Metadata> {
  const {locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[locale].press

  return listMetadata(locale, 'press', copy.title, copy.intro)
}

export default async function PressPage({params}: PressPageProps) {
  const {locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[locale].press
  const entries = await publicEditorialReader.listPressEntries(locale)
  const categories = ['FEATURE', 'INTERVIEW', 'REVIEW', 'NEWS'] as const
  const groups = categories
    .map(category => ({
      category,
      entries: entries.filter(entry => entry.pressCategory === category),
    }))
    .filter(group => group.entries.length > 0)

  return (
    <div className={styles.page}>
      <PublicPageIntro {...copy} illustration="landscape" />
      <PublicArchiveSection light>
        {groups.length > 0 ? (
          groups.map(group => {
            const headingId = `press-${group.category.toLowerCase()}`
            const categoryLabel =
              publicRouteCopy[locale].pressCategories[group.category]

            return (
              <section
                aria-labelledby={headingId}
                className={styles.pressGroup}
                key={group.category}
              >
                <h2 id={headingId}>{categoryLabel}</h2>
                <PublicEditorialList
                  accessibleName={categoryLabel}
                  actionLabel={publicRouteCopy[locale].readPress}
                  empty={copy.empty}
                  items={group.entries.map(entry => ({
                    description: entry.excerpt,
                    eyebrow: [
                      entry.outlet,
                      entry.publishedOn
                        ? publicDate(entry.publishedOn, locale)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · '),
                    href: localizedPath(locale, `/press/${entry.slug}`),
                    id: entry.id,
                    media: heroMedia(entry),
                    title: entry.title,
                  }))}
                />
              </section>
            )
          })
        ) : (
          <p role="status">{copy.empty}</p>
        )}
      </PublicArchiveSection>
    </div>
  )
}
