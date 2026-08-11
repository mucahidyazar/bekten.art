import Link from 'next/link'

import {PublicArtworkFrame} from './public-artwork-frame'
import {PublicContainer} from './public-container'
import styles from './public-editorial-hero.module.css'
import {
  NAV_FORWARD_TRANSITION,
  SharedEditorialTransition,
} from './public-view-transition'

import type {PublicEditorialMediaPlacement} from '@/server/public-editorial'

type PublicEditorialHeroProps = Readonly<{
  action?: Readonly<{href: string; label: string}>
  caption?: string | null
  credit?: string | null
  eyebrow?: string | null
  fallbackAlt?: string
  fallbackSrc?: string
  media?: PublicEditorialMediaPlacement
  paragraphs: readonly string[]
  title: string
  titleDensity?: 'compact' | 'standard'
  transitionKey?: string
}>

export function PublicEditorialHero({
  action,
  caption,
  credit,
  eyebrow,
  fallbackAlt,
  fallbackSrc,
  media,
  paragraphs,
  title,
  titleDensity: requestedTitleDensity,
  transitionKey,
}: PublicEditorialHeroProps) {
  const resolvedCaption = caption ?? media?.caption
  const resolvedCredit = credit ?? media?.credit
  const hasImage = Boolean(media || fallbackSrc)
  const titleDensity =
    requestedTitleDensity ?? (title.length > 20 ? 'compact' : 'standard')

  return (
    <PublicContainer
      as="header"
      className={styles.hero}
      data-public-editorial-hero=""
    >
      <div className={styles.copy}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        {transitionKey ? (
          <SharedEditorialTransition kind="title" publicKey={transitionKey}>
            <h1
              className={`${styles.title} ${titleDensity === 'compact' ? styles.titleCompact : ''}`.trim()}
              data-title-density={titleDensity}
            >
              {title}
            </h1>
          </SharedEditorialTransition>
        ) : (
          <h1
            className={`${styles.title} ${titleDensity === 'compact' ? styles.titleCompact : ''}`.trim()}
            data-title-density={titleDensity}
          >
            {title}
          </h1>
        )}
        <span aria-hidden="true" className={styles.rule} />
        <div className={styles.lede}>
          {paragraphs.map(paragraph => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {action ? (
          <Link
            className={styles.action}
            href={action.href}
            transitionTypes={
              action.href.startsWith('#')
                ? undefined
                : [...NAV_FORWARD_TRANSITION]
            }
          >
            <span>{action.label}</span>
            <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>

      {hasImage ? (
        <figure className={styles.figure}>
          {transitionKey ? (
            <SharedEditorialTransition kind="image" publicKey={transitionKey}>
              <PublicArtworkFrame
                fallbackAlt={fallbackAlt}
                fallbackSrc={fallbackSrc}
                media={media}
                priority
                sizes="(max-width: 896px) 100vw, 58vw"
              />
            </SharedEditorialTransition>
          ) : (
            <PublicArtworkFrame
              fallbackAlt={fallbackAlt}
              fallbackSrc={fallbackSrc}
              media={media}
              priority
              sizes="(max-width: 896px) 100vw, 58vw"
            />
          )}
          {resolvedCaption || resolvedCredit ? (
            <figcaption className={styles.caption}>
              {resolvedCaption ? <span>{resolvedCaption}</span> : <span />}
              {resolvedCredit ? <span>{resolvedCredit}</span> : null}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
    </PublicContainer>
  )
}
