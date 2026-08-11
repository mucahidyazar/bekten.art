import Link from 'next/link'

import {localizedPath} from '@/lib/localized-path'

import styles from './catalog-layouts.module.css'
import {publicCopyLocale} from './public-copy'
import {PublicEditorialImage} from './public-editorial-image'
import {
  NAV_FORWARD_TRANSITION,
  SharedEditorialTransition,
} from './public-view-transition'

import type {PublicLocale} from './public-copy'
import type {PublicArtwork} from '@/server/public-editorial'

const availabilityCopy = Object.freeze({
  en: {
    AVAILABLE: 'Available',
    NOT_AVAILABLE: 'In archive',
    ON_REQUEST: 'On request',
    RESERVED: 'Reserved',
  },
  ky: {
    AVAILABLE: 'Жеткиликтүү',
    NOT_AVAILABLE: 'Архивде',
    ON_REQUEST: 'Суроо боюнча',
    RESERVED: 'Брондолгон',
  },
  ru: {
    AVAILABLE: 'Доступно',
    NOT_AVAILABLE: 'В архиве',
    ON_REQUEST: 'По запросу',
    RESERVED: 'Зарезервировано',
  },
  tr: {
    AVAILABLE: 'Uygun',
    NOT_AVAILABLE: 'Arşivde',
    ON_REQUEST: 'Talep üzerine',
    RESERVED: 'Rezerve',
  },
})

type PublicArtworkGridProps = Readonly<{
  actionLabel?: string
  locale: PublicLocale
  priorityFirst?: boolean
  works: readonly PublicArtwork[]
}>

function heroMedia(work: PublicArtwork) {
  return (
    work.mediaPlacements.find(placement => placement.role === 'HERO') ??
    work.mediaPlacements[0]
  )
}

export function PublicArtworkGrid({
  actionLabel,
  locale,
  priorityFirst = false,
  works,
}: PublicArtworkGridProps) {
  return (
    <ol className={styles.artGrid}>
      {works.map((work, index) => {
        const media = heroMedia(work)
        const metadata = [work.year, work.medium, work.dimensions].filter(
          Boolean,
        )

        return (
          <li className={styles.artCard} key={work.id}>
            <article>
              <Link
                href={localizedPath(locale, `/works/${work.slug}`)}
                transitionTypes={[...NAV_FORWARD_TRANSITION]}
              >
                {media ? (
                  <SharedEditorialTransition kind="image" publicKey={work.slug}>
                    <div className={styles.artImage}>
                      <PublicEditorialImage
                        media={media}
                        priority={priorityFirst && index === 0}
                        sizes="(max-width: 544px) 100vw, (max-width: 768px) 50vw, (max-width: 1152px) 33vw, 25vw"
                      />
                    </div>
                  </SharedEditorialTransition>
                ) : null}
                <p className={styles.artNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <SharedEditorialTransition kind="title" publicKey={work.slug}>
                  <h3 className={styles.artTitle}>{work.title}</h3>
                </SharedEditorialTransition>
              </Link>
              {metadata.map(value => (
                <p className={styles.artMeta} key={value}>
                  {value}
                </p>
              ))}
              <p className={styles.availability}>
                {availabilityCopy[publicCopyLocale(locale)][work.availability]}
              </p>
              {actionLabel ? (
                <Link
                  className={styles.editorialAction}
                  href={`${localizedPath(locale, `/works/${work.slug}`)}#availability-inquiry`}
                  transitionTypes={[...NAV_FORWARD_TRANSITION]}
                >
                  {actionLabel}
                </Link>
              ) : null}
            </article>
          </li>
        )
      })}
    </ol>
  )
}
