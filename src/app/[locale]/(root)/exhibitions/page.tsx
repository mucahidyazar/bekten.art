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

type ExhibitionsPageProps = Readonly<{params: Promise<{locale: string}>}>

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: ExhibitionsPageProps): Promise<Metadata> {
  const {contentLocale, locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[contentLocale].exhibitions

  return listMetadata(locale, 'exhibitions', copy.title, copy.intro)
}

export default async function ExhibitionsPage({params}: ExhibitionsPageProps) {
  const {contentLocale, locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[contentLocale].exhibitions
  const exhibitions = await publicEditorialReader.listExhibitions(contentLocale)
  const [featured, ...timeline] = exhibitions

  const exhibitionItem = (exhibition: (typeof exhibitions)[number]) => ({
    contentLocale: exhibition.locale,
    description: exhibition.subtitle ?? exhibition.body,
    eyebrow: [exhibition.venue, publicDate(exhibition.startsAt, locale)]
      .filter(Boolean)
      .join(' · '),
    href: localizedPath(locale, `/exhibitions/${exhibition.slug}`),
    id: exhibition.id,
    media: heroMedia(exhibition),
    publicKey: exhibition.slug,
    title: exhibition.title,
  })

  return (
    <div className={styles.page}>
      <PublicPageIntro {...copy} media={featured ? heroMedia(featured) : undefined} />
      <PublicArchiveSection light>
        {featured ? (
          <>
            <section
              aria-label={publicRouteCopy[contentLocale].featuredExhibition}
              className={styles.featuredRegion}
            >
              <PublicEditorialCard
                actionLabel={publicRouteCopy[contentLocale].viewExhibition}
                contentLocale={featured.locale}
                description={featured.subtitle ?? featured.body}
                eyebrow={[featured.venue, publicDate(featured.startsAt, locale)]
                  .filter(Boolean)
                  .join(' · ')}
                href={localizedPath(locale, `/exhibitions/${featured.slug}`)}
                media={heroMedia(featured)}
                publicKey={featured.slug}
                title={featured.title}
                variant="featured"
              />
            </section>
            {timeline.length > 0 ? (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {publicRouteCopy[contentLocale].exhibitionTimeline}
                  </h2>
                </div>
                <PublicEditorialList
                  accessibleName={publicRouteCopy[contentLocale].exhibitionTimeline}
                  actionLabel={publicRouteCopy[contentLocale].viewExhibition}
                  empty={copy.empty}
                  items={timeline.map(exhibitionItem)}
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
