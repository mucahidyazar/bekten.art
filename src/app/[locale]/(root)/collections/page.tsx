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
  const {contentLocale, locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[contentLocale].collections

  return listMetadata(locale, 'collections', copy.title, copy.intro)
}

export default async function CollectionsPage({params}: CollectionsPageProps) {
  const {contentLocale, locale} = await parsePublicParams(params)
  const copy = publicRouteCopy[contentLocale].collections
  const collections = await publicEditorialReader.listCollections(contentLocale)
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
            ? publicRouteCopy[contentLocale].viewCollection
            : publicRouteCopy[contentLocale].collectionArchive
        }
        illustration="collection"
        titleDensity="compact"
      />
      <PublicArchiveSection id="collection-archive" light>
        {featured ? (
          <>
            <section
              aria-label={publicRouteCopy[contentLocale].featuredCollection}
              className={styles.featuredRegion}
            >
              <PublicEditorialCard
                actionLabel={publicRouteCopy[contentLocale].viewCollection}
                contentLocale={featured.locale}
                description={featured.description}
                eyebrow={copy.kicker}
                href={localizedPath(locale, `/collections/${featured.slug}`)}
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
                    {publicRouteCopy[contentLocale].collectionArchive}
                  </h2>
                </div>
                <PublicEditorialList
                  accessibleName={publicRouteCopy[contentLocale].collectionArchive}
                  actionLabel={publicRouteCopy[contentLocale].viewCollection}
                  empty={copy.empty}
                  items={archive.map(collection => ({
                    contentLocale: collection.locale,
                    description: collection.description,
                    eyebrow: copy.kicker,
                    href: localizedPath(
                      locale,
                      `/collections/${collection.slug}`,
                    ),
                    id: collection.id,
                    media: heroMedia(collection),
                    publicKey: collection.slug,
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
