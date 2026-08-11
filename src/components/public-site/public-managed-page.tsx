import {PublicArtworkFrame} from './public-artwork-frame'

import type {PublicPage} from '@/server/public-editorial'

type PublicManagedPageProps = Readonly<{
  children?: React.ReactNode
  page: PublicPage
}>

function pageHero(page: PublicPage) {
  return (
    page.mediaPlacements.find(placement => placement.role === 'HERO') ??
    page.mediaPlacements[0]
  )
}

function bodyParagraphs(body: string) {
  return body
    .split(/\n\s*\n/u)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
}

export function PublicManagedPage({children, page}: PublicManagedPageProps) {
  const hero = pageHero(page)

  return (
    <article className="heritage-managed-page">
      <header className="heritage-managed-page__header">
        <div className="heritage-shell heritage-managed-page__intro">
          {page.eyebrow ? (
            <p className="heritage-kicker">{page.eyebrow}</p>
          ) : null}
          <h1 className="heritage-display">{page.title}</h1>
        </div>
      </header>

      {hero ? (
        <figure className="heritage-shell heritage-managed-page__hero">
          <PublicArtworkFrame
            media={hero}
            priority
            sizes="(max-width: 768px) 100vw, 80vw"
          />
          {hero.caption || hero.credit ? (
            <figcaption>
              {[hero.caption, hero.credit].filter(Boolean).join(' · ')}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <div className="heritage-shell heritage-managed-page__body">
        <div className="heritage-prose">
          {bodyParagraphs(page.body).map(paragraph => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      {children ? (
        <div className="heritage-shell heritage-managed-page__continuation">
          {children}
        </div>
      ) : null}
    </article>
  )
}
