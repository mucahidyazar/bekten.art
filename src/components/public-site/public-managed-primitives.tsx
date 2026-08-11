import Image from 'next/image'
import Link from 'next/link'

import {localizedPath} from '@/lib/localized-path'

import styles from './public-managed-pages.module.css'
import {PublicEditorialImage} from './public-editorial-image'

import type {PublicLocale} from './public-copy'
import type {
  PublicEditorialMediaPlacement,
  PublicPage,
} from '@/server/public-editorial'

type ManagedFigureProps = Readonly<{
  fallbackSrc: string
  media?: PublicEditorialMediaPlacement
  priority?: boolean
  variant?: 'detail' | 'hero'
}>

type ManagedHeroProps = Readonly<{
  action?: Readonly<{href: string; label: string}>
  fallbackSrc: string
  locale: PublicLocale
  media?: PublicEditorialMediaPlacement
  page: PublicPage
  paragraphs: readonly string[]
}>

type EditorialLinkProps = Readonly<{
  href: string
  label: string
  locale: PublicLocale
}>

export function bodyParagraphs(body: string) {
  return body
    .split(/\n\s*\n/u)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
}

export function pageHero(page: PublicPage) {
  return (
    page.mediaPlacements.find(placement => placement.role === 'HERO') ??
    page.mediaPlacements[0]
  )
}

export function pageDetailMedia(page: PublicPage) {
  const hero = pageHero(page)

  return page.mediaPlacements.find(placement => placement !== hero)
}

export function ManagedFigure({
  fallbackSrc,
  media,
  priority = false,
  variant = 'detail',
}: ManagedFigureProps) {
  return (
    <figure className={styles[variant === 'hero' ? 'heroFigure' : 'detailFigure']}>
      <div className={styles.frame}>
        {media ? (
          <PublicEditorialImage
            media={media}
            priority={priority}
            sizes={
              variant === 'hero'
                ? '(max-width: 800px) 100vw, 58vw'
                : '(max-width: 800px) 100vw, 42vw'
            }
          />
        ) : (
          <Image
            alt=""
            aria-hidden="true"
            fill
            priority={priority}
            sizes={
              variant === 'hero'
                ? '(max-width: 800px) 100vw, 58vw'
                : '(max-width: 800px) 100vw, 42vw'
            }
            src={fallbackSrc}
          />
        )}
      </div>
      {media && (media.caption || media.credit) ? (
        <figcaption className={styles.caption}>
          {media.caption ? <span>{media.caption}</span> : null}
          {media.credit ? <span>{media.credit}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  )
}

export function EditorialLink({href, label, locale}: EditorialLinkProps) {
  const resolvedHref = href.startsWith('#') ? href : localizedPath(locale, href)

  return (
    <Link className={styles.textLink} href={resolvedHref}>
      <span>{label}</span>
      <span aria-hidden="true">→</span>
    </Link>
  )
}

export function ManagedHero({
  action,
  fallbackSrc,
  locale,
  media,
  page,
  paragraphs,
}: ManagedHeroProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.heroCopy}>
        {page.eyebrow ? <p className={styles.eyebrow}>{page.eyebrow}</p> : null}
        <h1 className={styles.title}>{page.title}</h1>
        <span aria-hidden="true" className={styles.rustRule} />
        <div className={styles.lede}>
          {paragraphs.map(paragraph => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {action ? (
          <EditorialLink href={action.href} label={action.label} locale={locale} />
        ) : null}
      </div>
      <ManagedFigure
        fallbackSrc={fallbackSrc}
        media={media}
        priority
        variant="hero"
      />
    </header>
  )
}

export function SectionHeading({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <div className={styles.sectionHeading}>
      <h2>{children}</h2>
      <span aria-hidden="true" />
    </div>
  )
}
