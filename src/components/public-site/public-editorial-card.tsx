import Link from 'next/link'

import styles from './catalog-layouts.module.css'
import {PublicEditorialImage} from './public-editorial-image'

import type {PublicEditorialMediaPlacement} from '@/server/public-editorial'

type PublicEditorialCardProps = Readonly<{
  actionLabel?: string
  description: string
  eyebrow: string
  href: string
  media?: PublicEditorialMediaPlacement
  title: string
  variant?: 'default' | 'featured' | 'row'
}>

export function PublicEditorialCard({
  actionLabel,
  description,
  eyebrow,
  href,
  media,
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
    <article className={`${styles.editorialCard} ${variantClass}`.trim()}>
      <Link className={styles.editorialCardLink} href={href}>
        {media ? (
          <div className={styles.editorialImage}>
            <PublicEditorialImage
              media={media}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ) : null}
        <div className={styles.editorialContent}>
          <p className={styles.editorialEyebrow}>{eyebrow}</p>
          <h3 className={styles.editorialTitle}>{title}</h3>
          <p className={styles.editorialDescription}>{description}</p>
          {actionLabel ? (
            <span className={styles.editorialAction}>{actionLabel}</span>
          ) : null}
        </div>
      </Link>
    </article>
  )
}
