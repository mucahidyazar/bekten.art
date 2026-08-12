'use client'

import {ChevronLeft, ChevronRight} from 'lucide-react'
import {useCallback, useState} from 'react'

import {PublicArtworkFrame} from './public-artwork-frame'
import styles from './public-work-media.module.css'

import type {PublicEditorialMediaPlacement} from '@/server/public-editorial'

type PublicWorkMediaProps = Readonly<{
  label: string
  media: readonly PublicEditorialMediaPlacement[]
  nextLabel: string
  previousLabel: string
}>

function StaticWorkMedia({media}: Readonly<{media: PublicEditorialMediaPlacement}>) {
  return (
    <figure className={styles.staticMedia}>
      <PublicArtworkFrame
        media={media}
        priority
        sizes="(max-width: 768px) 100vw, 55vw"
      />
      {media.caption ? <figcaption>{media.caption}</figcaption> : null}
    </figure>
  )
}

export function PublicWorkMedia({
  label,
  media,
  nextLabel,
  previousLabel,
}: PublicWorkMediaProps) {
  const [active, setActive] = useState(0)
  const count = media.length
  const select = useCallback(
    (index: number) => setActive((index + count) % count),
    [count],
  )

  if (count === 0) return null
  if (count === 1) return <StaticWorkMedia media={media[0]} />

  return (
    <section
      aria-label={label}
      aria-roledescription="carousel"
      className={styles.carousel}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          select(active - 1)
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          select(active + 1)
        }
      }}
      tabIndex={0}
    >
      <div className={styles.viewport}>
        <div
          className={styles.track}
          style={{transform: `translate3d(-${active * 100}%, 0, 0)`}}
        >
          {media.map((placement, index) => (
            <figure
              aria-hidden={index === active ? undefined : true}
              aria-label={`${index + 1} / ${count}`}
              aria-roledescription="slide"
              className={styles.slide}
              key={`${placement.mediaObjectId}-${placement.displayOrder}`}
            >
              <PublicArtworkFrame
                media={placement}
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 55vw"
              />
              {placement.caption ? (
                <figcaption>{placement.caption}</figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </div>
      <div className={styles.controls}>
        <button
          aria-label={previousLabel}
          onClick={() => select(active - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <p aria-live="polite" role="status">
          {active + 1} / {count}
        </p>
        <button
          aria-label={nextLabel}
          onClick={() => select(active + 1)}
          type="button"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
      <div
        aria-label={`${label} thumbnails`}
        className={styles.thumbnails}
        role="group"
      >
        {media.map((placement, index) => (
          <button
            aria-label={`${index + 1} / ${count}`}
            aria-pressed={index === active}
            key={placement.mediaObjectId}
            onClick={() => select(index)}
            type="button"
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
