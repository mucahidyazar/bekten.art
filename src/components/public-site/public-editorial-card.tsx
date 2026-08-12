import Link from 'next/link'

import styles from './catalog-layouts.module.css'
import {PublicEditorialImage} from './public-editorial-image'
import {
  NAV_FORWARD_TRANSITION,
  SharedEditorialTransition,
} from './public-view-transition'

import type {PublicEditorialMediaPlacement} from '@/server/public-editorial'

type PublicEditorialCardProps = Readonly<{
  actionLabel?: string
  contentLocale?: string
  description: string
  eyebrow: string
  href: string
  media?: PublicEditorialMediaPlacement
  publicKey: string
  title: string
  variant?: 'default' | 'featured' | 'row'
}>

export function PublicEditorialCard({
  actionLabel,
  contentLocale,
  description,
  eyebrow,
  href,
  media,
  publicKey,
  title,
  variant = 'default',
}: PublicEditorialCardProps) {
  const variantClass =
    variant === 'featured'
      ? styles.featuredCard
      : variant === 'row'
        ? styles.rowCard
        : ''

  return (
    <article
      className={`${styles.editorialCard} ${variantClass}`.trim()}
      lang={contentLocale}
    >
      <Link
        className={styles.editorialCardLink}
        href={href}
        transitionTypes={[...NAV_FORWARD_TRANSITION]}
      >
        {media ? (
          <SharedEditorialTransition kind="image" publicKey={publicKey}>
            <div className={styles.editorialImage}>
              <PublicEditorialImage
                media={media}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </SharedEditorialTransition>
        ) : null}
        <div className={styles.editorialContent}>
          <p className={styles.editorialEyebrow}>{eyebrow}</p>
          <SharedEditorialTransition kind="title" publicKey={publicKey}>
            <h3 className={styles.editorialTitle}>{title}</h3>
          </SharedEditorialTransition>
          <p className={styles.editorialDescription}>{description}</p>
          {actionLabel ? (
            <span className={styles.editorialAction}>{actionLabel}</span>
          ) : null}
        </div>
      </Link>
    </article>
  )
}
