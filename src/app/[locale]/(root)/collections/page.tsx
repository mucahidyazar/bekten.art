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
  publicRouteCopy,
} from '../works/public-route-helpers'

type CollectionsPageProps = Readonly<{params: Promise<{locale: string}>}>

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: CollectionsPageProps): Promise<Metadata> {
  const {locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[locale].collections

  return listMetadata(locale, 'collections', copy.title, copy.intro)
}

export default async function CollectionsPage({params}: CollectionsPageProps) {
  const {locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[locale].collections
  const collections = await publicEditorialReader.listCollections(locale)
  const [featured, ...archive] = collections

  return (
    <div className={styles.page}>
      <PublicPageIntro
        {...copy}
        actionHref={
          featured
            ? localizedPath(locale, `/collections/${featured.slug}`)
            : '#collection-archive'
        }
        actionLabel={
          featured
            ? publicRouteCopy[locale].viewCollection
            : publicRouteCopy[locale].collectionArchive
        }
        illustration="collection"
      />
      <PublicArchiveSection id="collection-archive" light>
        {featured ? (
          <>
            <section
              aria-label={publicRouteCopy[locale].featuredCollection}
              className={styles.featuredRegion}
            >
              <PublicEditorialCard
                actionLabel={publicRouteCopy[locale].viewCollection}
                description={featured.description}
                eyebrow={copy.kicker}
                href={localizedPath(locale, `/collections/${featured.slug}`)}
                media={heroMedia(featured)}
                title={featured.title}
                variant="featured"
              />
            </section>
            {archive.length > 0 ? (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {publicRouteCopy[locale].collectionArchive}
                  </h2>
                </div>
                <PublicEditorialList
                  accessibleName={publicRouteCopy[locale].collectionArchive}
                  actionLabel={publicRouteCopy[locale].viewCollection}
                  empty={copy.empty}
                  items={archive.map(collection => ({
                    description: collection.description,
                    eyebrow: copy.kicker,
                    href: localizedPath(
                      locale,
                      `/collections/${collection.slug}`,
                    ),
                    id: collection.id,
                    media: heroMedia(collection),
                    title: collection.title,
                  }))}
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
