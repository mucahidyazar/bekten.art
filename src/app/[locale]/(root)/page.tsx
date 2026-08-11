import {Metadata} from 'next'

import Image from 'next/image'
import Link from 'next/link'

import {PublicArtworkGrid} from '@/components/public-site/public-artwork-grid'
import {
  publicCopyLocale,
  publicLocale,
  type BuiltInPublicLocale,
} from '@/components/public-site/public-copy'
import {PublicEditorialCard} from '@/components/public-site/public-editorial-card'
import {PublicEditorialHero} from '@/components/public-site/public-editorial-hero'
import {NAV_FORWARD_TRANSITION} from '@/components/public-site/public-view-transition'
import {getSiteIdentity} from '@/components/seo/site-identity'
import {localizedPath} from '@/lib/localized-path'
import {publicEditorialReader} from '@/server/public-editorial'
import {prepareMetadata} from '@/utils/prepare-metadata'

import type {PublicEditorialMediaPlacement} from '@/server/public-editorial'

type PageProps = Readonly<{params: Promise<{locale: string}>}>

const homeCopy: Readonly<
  Record<
    BuiltInPublicLocale,
    Readonly<{
      archiveEmpty: string
      archiveLabel: string
      aboutArtist: string
      aboutLabel: string
      collections: string
      contextsLabel: string
      exhibitions: string
      exploreWorks: string
      intro: string
      journal: string
      kicker: string
      latestStories: string
      selectedWorks: string
      title: string
      discoverArtist: string
      viewAll: string
    }>
  >
> = Object.freeze({
  en: {
    archiveEmpty: 'The Studio is preparing this part of the archive.',
    archiveLabel: 'Archive',
    aboutArtist: 'About the artist',
    aboutLabel: 'Artist & studio',
    collections: 'Collections',
    contextsLabel: 'Notes & contexts',
    exhibitions: 'Exhibitions',
    exploreWorks: 'Explore works',
    intro:
      'Bekten’s practice brings landscape, inherited memory and human presence into quiet conversation.',
    journal: 'Journal',
    kicker: 'Contemporary artist · Bishkek',
    latestStories: 'From the working archive',
    selectedWorks: 'Selected works',
    title: 'Art that remembers',
    discoverArtist: 'Discover the artist',
    viewAll: 'View the archive',
  },
  ky: {
    archiveEmpty: 'Студия архивдин бул бөлүгүн даярдап жатат.',
    archiveLabel: 'Архив',
    aboutArtist: 'Сүрөтчү жөнүндө',
    aboutLabel: 'Сүрөтчү жана студия',
    collections: 'Жыйнактар',
    contextsLabel: 'Жазуулар жана контексттер',
    exhibitions: 'Көргөзмөлөр',
    exploreWorks: 'Эмгектерди көрүү',
    intro:
      'Бектендин чыгармачылыгы пейзажды, мураска калган эстутумду жана адамдын катышуусун тынч баарлашууга бириктирет.',
    journal: 'Журнал',
    kicker: 'Заманбап сүрөтчү · Бишкек',
    latestStories: 'Иштөөчү архивден',
    selectedWorks: 'Тандалган эмгектер',
    title: 'Эстеген искусство',
    discoverArtist: 'Сүрөтчүнү таануу',
    viewAll: 'Архивди көрүү',
  },
  ru: {
    archiveEmpty: 'Студия готовит эту часть архива.',
    archiveLabel: 'Архив',
    aboutArtist: 'О художнике',
    aboutLabel: 'Художник и студия',
    collections: 'Коллекции',
    contextsLabel: 'Заметки и контексты',
    exhibitions: 'Выставки',
    exploreWorks: 'Смотреть работы',
    intro:
      'Практика Бектена соединяет пейзаж, унаследованную память и человеческое присутствие в тихом диалоге.',
    journal: 'Журнал',
    kicker: 'Современный художник · Бишкек',
    latestStories: 'Из рабочего архива',
    selectedWorks: 'Избранные работы',
    title: 'Искусство, которое помнит',
    discoverArtist: 'Узнать о художнике',
    viewAll: 'Смотреть архив',
  },
  tr: {
    archiveEmpty: 'Stüdyo arşivin bu bölümünü hazırlıyor.',
    archiveLabel: 'Arşiv',
    aboutArtist: 'Sanatçı hakkında',
    aboutLabel: 'Sanatçı ve stüdyo',
    collections: 'Koleksiyonlar',
    contextsLabel: 'Notlar ve bağlamlar',
    exhibitions: 'Sergiler',
    exploreWorks: 'Eserleri keşfet',
    intro:
      'Bekten’in pratiği peyzajı, miras kalan hafızayı ve insan varlığını sakin bir diyalogda buluşturuyor.',
    journal: 'Journal',
    kicker: 'Çağdaş sanatçı · Bişkek',
    latestStories: 'Çalışan arşivden',
    selectedWorks: 'Seçili eserler',
    title: 'Hatırlayan sanat',
    discoverArtist: 'Sanatçıyı keşfet',
    viewAll: 'Arşivi incele',
  },
})

function firstMedia(placements: readonly PublicEditorialMediaPlacement[]) {
  return (
    placements.find(placement => placement.role === 'HERO') ?? placements[0]
  )
}

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const locale = publicLocale((await params).locale)
  const copy = homeCopy[publicCopyLocale(locale)]

  return prepareMetadata({
    contentLocale: locale,
    description: copy.intro,
    title: `${copy.title} — Bekten`,
  })
}

export default async function Home({params}: PageProps) {
  const locale = publicLocale((await params).locale)
  const contentLocale = publicCopyLocale(locale)
  const copy = homeCopy[contentLocale]
  const identity = getSiteIdentity(locale)
  const content = await publicEditorialReader.getHomepage(contentLocale)
  const heroMedia = content.hero
    ? firstMedia(content.hero.mediaPlacements)
    : null
  const editorialFeatures = [
    ...content.collections.slice(0, 1).map(entry => ({
      description: entry.description,
      eyebrow: copy.collections,
      href: localizedPath(locale, `/collections/${entry.slug}`),
      id: entry.id,
      media: firstMedia(entry.mediaPlacements),
      publicKey: entry.slug,
      title: entry.title,
    })),
    ...content.exhibitions.slice(0, 1).map(entry => ({
      description: entry.subtitle || entry.body,
      eyebrow: copy.exhibitions,
      href: localizedPath(locale, `/exhibitions/${entry.slug}`),
      id: entry.id,
      media: firstMedia(entry.mediaPlacements),
      publicKey: entry.slug,
      title: entry.title,
    })),
    ...content.journalEntries.slice(0, 1).map(entry => ({
      description: entry.excerpt,
      eyebrow: copy.journal,
      href: localizedPath(locale, `/journal/${entry.slug}`),
      id: entry.id,
      media: firstMedia(entry.mediaPlacements),
      publicKey: entry.slug,
      title: entry.title,
    })),
  ]

  return (
    <div className="heritage-home">
      <PublicEditorialHero
        action={{
          href: localizedPath(locale, '/works'),
          label: copy.exploreWorks,
        }}
        caption={content.hero?.title}
        credit={
          content.hero
            ? [content.hero.year, content.hero.medium]
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        eyebrow={copy.kicker}
        fallbackAlt={content.hero?.title ?? copy.title}
        fallbackSrc="/img/heritage-landscape-hero.jpg"
        media={heroMedia ?? undefined}
        paragraphs={[copy.intro]}
        title={copy.title}
      />

      <section className="heritage-section heritage-section--paper-light">
        <div className="heritage-shell">
          <div className="heritage-section-heading">
            <div>
              <p className="heritage-kicker">01 · {copy.archiveLabel}</p>
              <h2>{copy.selectedWorks}</h2>
            </div>
            <Link
              className="heritage-text-link"
              href={localizedPath(locale, '/works')}
              transitionTypes={[...NAV_FORWARD_TRANSITION]}
            >
              {copy.viewAll}
            </Link>
          </div>
          {content.works.length > 0 ? (
            <PublicArtworkGrid
              locale={locale}
              priorityFirst={!heroMedia}
              works={content.works}
            />
          ) : (
            <p>{copy.archiveEmpty}</p>
          )}
        </div>
      </section>

      <section className="heritage-artist-strip heritage-illustrated-band">
        <div className="heritage-shell heritage-artist-strip__grid">
          <figure className="heritage-artist-strip__portrait">
            <Image
              alt="Bekten Usubaliev"
              height={778}
              sizes="(max-width: 768px) 100vw, 34vw"
              src="/me.jpg"
              width={1180}
            />
          </figure>
          <div className="heritage-artist-strip__copy">
            <p className="heritage-kicker">{copy.aboutLabel}</p>
            <h2>{copy.aboutArtist}</h2>
            <p>{identity.artistDescription}</p>
            <Link
              className="heritage-button"
              href={localizedPath(locale, '/about')}
              transitionTypes={[...NAV_FORWARD_TRANSITION]}
            >
              {copy.discoverArtist}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {editorialFeatures.length > 0 ? (
        <section className="heritage-section">
          <div className="heritage-shell">
            <div className="heritage-section-heading">
              <div>
                <p className="heritage-kicker">02 · {copy.contextsLabel}</p>
                <h2>{copy.latestStories}</h2>
              </div>
            </div>
            <div className="heritage-editorial-grid">
              {editorialFeatures.map(feature => (
                <PublicEditorialCard {...feature} key={feature.id} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="heritage-home-quote heritage-paper-grain">
        <div className="heritage-shell">
          <blockquote>
            <span aria-hidden="true">“</span>
            {copy.intro}
          </blockquote>
          <Link
            className="heritage-text-link"
            href={localizedPath(locale, '/about')}
            transitionTypes={[...NAV_FORWARD_TRANSITION]}
          >
            Bekten
          </Link>
        </div>
      </section>
    </div>
  )
}
