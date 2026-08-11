import Link from 'next/link'

import {localizedPath} from '@/lib/localized-path'

import {PublicArtworkFrame} from './public-artwork-frame'
import styles from './public-managed-pages.module.css'

import type {PublicLocale} from './public-copy'
import type {
  PublicEditorialMediaPlacement,
  PublicPage,
} from '@/server/public-editorial'

type ManagedFigureProps = Readonly<{
  fallbackSrc: string
  framing?: 'framed' | 'panoramic' | 'plain'
  media?: PublicEditorialMediaPlacement
  priority?: boolean
  variant?: 'detail' | 'hero'
}>

type ManagedHeroProps = Readonly<{
  action?: Readonly<{href: string; label: string}>
  composition?: 'framed' | 'panoramic' | 'plain'
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

export function EditorialLink({href, label, locale}: EditorialLinkProps) {
  const resolvedHref = href.startsWith('#') ? href : localizedPath(locale, href)

  return (
    <Link className={styles.textLink} href={resolvedHref}>
      <span>{label}</span>
      <span aria-hidden="true">→</span>
    </Link>
  )
}

export function ManagedFigure({
  fallbackSrc,
  framing = 'framed',
  media,
  priority = false,
  variant = 'detail',
}: ManagedFigureProps) {
  const figureClassName = [
    styles[variant === 'hero' ? 'heroFigure' : 'detailFigure'],
    styles[`${framing}Figure`],
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <figure className={figureClassName}>
      <PublicArtworkFrame
        className={styles[`${framing}ArtworkFrame`]}
        fallbackSrc={fallbackSrc}
        media={media}
        priority={priority}
        sizes={
          variant === 'hero'
            ? '(max-width: 800px) 100vw, 58vw'
            : '(max-width: 800px) 100vw, 42vw'
        }
      />
      {media && (media.caption || media.credit) ? (
        <figcaption className={styles.caption}>
          {media.caption ? <span>{media.caption}</span> : null}
          {media.credit ? <span>{media.credit}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  )
}

export function ManagedHero({
  action,
  composition = 'framed',
  fallbackSrc,
  locale,
  media,
  page,
  paragraphs,
}: ManagedHeroProps) {
  return (
    <header
      className={`${styles.hero} ${composition === 'panoramic' ? styles.panoramicHero : ''}`}
    >
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
          <EditorialLink
            href={action.href}
            label={action.label}
            locale={locale}
          />
        ) : null}
      </div>
      <ManagedFigure
        fallbackSrc={fallbackSrc}
        framing={composition}
        media={media}
        priority
        variant="hero"
      />
    </header>
  )
}

export function SectionHeading({
  children,
}: Readonly<{children: React.ReactNode}>) {
  return (
    <div className={styles.sectionHeading}>
      <h2>{children}</h2>
      <span aria-hidden="true" />
    </div>
  )
}

export function bodyParagraphs(body: string) {
  return body
    .split(/\n\s*\n/u)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
}

export function pageDetailMedia(page: PublicPage) {
  const hero = pageHero(page)

  return page.mediaPlacements.find(placement => placement !== hero)
}

export function pageHero(page: PublicPage) {
  return (
    page.mediaPlacements.find(placement => placement.role === 'HERO') ??
    page.mediaPlacements[0]
  )
}
