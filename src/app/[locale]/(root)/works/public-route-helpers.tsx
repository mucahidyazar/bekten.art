import type {Metadata} from 'next'

import {notFound} from 'next/navigation'

import styles from '@/components/public-site/catalog-layouts.module.css'
import {
  publicCopyLocale,
  publicLocale,
} from '@/components/public-site/public-copy'
import {PublicEditorialCard} from '@/components/public-site/public-editorial-card'
import {PublicEditorialHero} from '@/components/public-site/public-editorial-hero'
import {isSafeLocaleCode, localizedPath} from '@/lib/localized-path'
import {
  kebabSlugSchema,
} from '@/server/editorial-content'
import {prepareMetadata} from '@/utils/prepare-metadata'

import type {
  BuiltInPublicLocale,
  PublicLocale,
} from '@/components/public-site/public-copy'
import type {PublicEditorialMediaPlacement} from '@/server/public-editorial'
import type {ReactNode} from 'react'

type PublicRouteCopy = Readonly<{
  articleDetails: string
  availabilityInquiry: string
  availableSelection: string
  availableWorks: Readonly<{
    empty: string
    intro: string
    kicker: string
    title: string
  }>
  collectionArchive: string
  collectionNote: string
  collectionWorks: string
  collections: Readonly<{
    empty: string
    intro: string
    introSecondary: string
    kicker: string
    title: string
  }>
  dimensions: string
  detailsFromWork: string
  exhibitedWorks: string
  exhibitionTimeline: string
  featuredCollection: string
  featuredExhibition: string
  featuredJournalEntry: string
  exhibitions: Readonly<{
    empty: string
    intro: string
    kicker: string
    title: string
  }>
  journal: Readonly<{
    empty: string
    intro: string
    kicker: string
    title: string
  }>
  journalArchive: string
  medium: string
  nextImage: string
  press: Readonly<{empty: string; intro: string; kicker: string; title: string}>
  pressCategories: Readonly<Record<PressCategory, string>>
  publicationDetails: string
  previousImage: string
  readJournal: string
  readPress: string
  readAtSource: string
  viewCollection: string
  viewExhibition: string
  workArchive: string
  workFacts: string
  works: Readonly<{empty: string; intro: string; kicker: string; title: string}>
  year: string
}>

type PressCategory = 'FEATURE' | 'INTERVIEW' | 'NEWS' | 'REVIEW'

function PublicArchiveSection({
  accessibleName,
  children,
  id,
  labelledBy,
  light = false,
}: ArchiveSectionProps) {
  return (
    <section
      aria-label={accessibleName}
      aria-labelledby={labelledBy}
      className={`${styles.section} ${light ? styles.sectionLight : ''}`.trim()}
      id={id}
    >
      <div className={styles.sectionInner}>{children}</div>
    </section>
  )
}

type RouteParams = Readonly<{locale: string; slug?: string}>

function PublicEditorialList({
  accessibleName,
  actionLabel,
  empty,
  items,
  variant = 'default',
}: Readonly<{
  accessibleName?: string
  actionLabel?: string
  empty: string
  items: readonly EditorialListItem[]
  variant?: 'default' | 'rows'
}>) {
  if (items.length === 0) return <p role="status">{empty}</p>

  return (
    <ol
      aria-label={accessibleName}
      className={`${styles.editorialList} ${variant === 'rows' ? styles.editorialListRows : ''}`.trim()}
    >
      {items.map(item => (
        <li key={item.id}>
          <PublicEditorialCard
            actionLabel={item.actionLabel ?? actionLabel}
            description={item.description}
            eyebrow={item.eyebrow}
            href={item.href}
            media={item.media}
            publicKey={item.publicKey}
            title={item.title}
            variant={variant === 'rows' ? 'row' : 'default'}
          />
        </li>
      ))}
    </ol>
  )
}
function PublicPageIntro({
  actionHref,
  actionLabel,
  illustration,
  intro,
  introSecondary,
  kicker,
  media,
  title,
  titleDensity,
  transitionKey,
}: PageIntroProps) {
  return (
    <PublicEditorialHero
      action={
        actionHref && actionLabel
          ? {href: actionHref, label: actionLabel}
          : undefined
      }
      eyebrow={kicker}
      fallbackAlt={media?.altText ?? title}
      fallbackSrc={
        illustration === 'collection'
          ? '/img/heritage-collection-hero.jpg'
          : '/img/heritage-landscape-hero.jpg'
      }
      media={media}
      paragraphs={[intro, ...(introSecondary ? [introSecondary] : [])]}
      title={title}
      titleDensity={titleDensity}
      transitionKey={transitionKey}
    />
  )
}
function PlainTextBody({body}: Readonly<{body: string}>) {
  const paragraphs = body
    .split(/\n{2,}/u)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)

  return (
    <div className={styles.articleBody}>
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph}`}>{paragraph}</p>
      ))}
    </div>
  )
}

type SeoRecord = Readonly<{
  canonicalPath: string
  description: string
  noIndex: boolean
  title: string
  transitionKey?: string
}>

function editorialMetadata(
  seo: SeoRecord,
  locale: PublicLocale,
  contentLocale: BuiltInPublicLocale = publicCopyLocale(locale),
): Metadata {
  const canonicalPath = localizedPath(contentLocale, seo.canonicalPath)

  return prepareMetadata({
    alternates: {canonical: canonicalPath},
    contentLocale,
    description: seo.description,
    openGraph: {
      description: seo.description,
      title: seo.title,
      url: canonicalPath,
    },
    robots: {
      follow: true,
      googleBot: {follow: true, index: !seo.noIndex},
      index: !seo.noIndex,
    },
    title: seo.title,
  })
}

function heroMedia(entity: {
  mediaPlacements: readonly PublicEditorialMediaPlacement[]
}) {
  return (
    entity.mediaPlacements.find(placement => placement.role === 'HERO') ??
    entity.mediaPlacements[0]
  )
}

type PageIntroProps = Readonly<{
  actionHref?: string
  actionLabel?: string
  illustration?: 'collection' | 'landscape'
  intro: string
  introSecondary?: string
  kicker: string
  media?: PublicEditorialMediaPlacement
  title: string
  titleDensity?: 'compact' | 'standard'
  transitionKey?: string
}>

type ArchiveSectionProps = Readonly<{
  accessibleName?: string
  children: ReactNode
  id?: string
  labelledBy?: string
  light?: boolean
}>

function listMetadata(
  locale: PublicLocale,
  path: string,
  title: string,
  description: string,
): Metadata {
  return editorialMetadata(
    {
      canonicalPath: localizedPath(locale, `/${path}`),
      description,
      noIndex: false,
      title,
    },
    locale,
    publicCopyLocale(locale),
  )
}

type EditorialListItem = Readonly<{
  actionLabel?: string
  description: string
  eyebrow: string
  href: string
  id: string
  media?: PublicEditorialMediaPlacement
  publicKey: string
  title: string
}>

function secondaryMedia(entity: {
  mediaPlacements: readonly PublicEditorialMediaPlacement[]
}) {
  const hero = heroMedia(entity)

  return entity.mediaPlacements.filter(
    placement => placement.mediaObjectId !== hero?.mediaObjectId,
  )
}

async function parsePublicParams(
  params: Promise<RouteParams>,
  options: Readonly<{slug: true}>,
): Promise<
  Readonly<{
    contentLocale: BuiltInPublicLocale
    locale: PublicLocale
    slug: string
  }>
>
async function parsePublicParams(
  params: Promise<RouteParams>,
  options?: Readonly<{slug?: false}>,
): Promise<
  Readonly<{contentLocale: BuiltInPublicLocale; locale: PublicLocale}>
>
async function parsePublicParams(
  params: Promise<RouteParams>,
  options: Readonly<{slug?: boolean}> = {},
) {
  const resolved = await params
  const locale = publicLocale(resolved.locale)

  if (!isSafeLocaleCode(resolved.locale)) {
    return notFound()
  }

  const contentLocale = publicCopyLocale(locale)

  if (!options.slug) return {contentLocale, locale}

  const slugResult = kebabSlugSchema.safeParse(resolved.slug)

  if (!slugResult.success) return notFound()

  return {contentLocale, locale, slug: slugResult.data}
}

const publicRouteCopy: Readonly<Record<BuiltInPublicLocale, PublicRouteCopy>> =
  Object.freeze({
    en: {
      articleDetails: 'Article details',
      availabilityInquiry: 'Availability inquiry',
      availableSelection: 'Available selection',
      availableWorks: {
        empty: 'No works are currently marked as available.',
        intro:
          'A considered selection of works currently open to an availability conversation with Bekten Studio.',
        kicker: 'Private acquisition enquiries',
        title: 'Available works',
      },
      collectionArchive: 'Collection archive',
      collectionNote: 'Collection note',
      collectionWorks: 'Works in this collection',
      collections: {
        empty: 'The Studio is preparing the collection archive.',
        intro:
          'Bodies of work gathered around memory, landscape, family and the changing cultural life of Central Asia.',
        introSecondary:
          'Explore each collection to see its published works and details.',
        kicker: 'Collections',
        title: 'Memory, land & home',
      },
      dimensions: 'Dimensions',
      detailsFromWork: 'Details from this work',
      exhibitedWorks: 'Exhibited works',
      exhibitionTimeline: 'Exhibition timeline',
      featuredCollection: 'Featured collection',
      featuredExhibition: 'Featured exhibition',
      featuredJournalEntry: 'Featured journal entry',
      exhibitions: {
        empty: 'The Studio is preparing the exhibition archive.',
        intro:
          'Selected exhibitions, presentations and encounters from Bekten Usubaliev’s working history.',
        kicker: 'Public record',
        title: 'Exhibitions',
      },
      journal: {
        empty: 'The first journal entry is being prepared.',
        intro:
          'Notes, stories and close observations from the studio and its living archive.',
        kicker: 'From the studio',
        title: 'Journal',
      },
      journalArchive: 'Journal archive',
      medium: 'Medium',
      nextImage: 'Next image',
      press: {
        empty: 'The press archive is being prepared.',
        intro:
          'Conversations, essays and published perspectives on the artist’s work.',
        kicker: 'Selected coverage',
        title: 'Press',
      },
      pressCategories: {
        FEATURE: 'Features',
        INTERVIEW: 'Interviews',
        NEWS: 'News',
        REVIEW: 'Reviews',
      },
      publicationDetails: 'Publication details',
      previousImage: 'Previous image',
      readJournal: 'Read entry',
      readPress: 'Read publication',
      readAtSource: 'Read at source',
      viewCollection: 'View collection',
      viewExhibition: 'View exhibition',
      workArchive: 'Work archive',
      workFacts: 'Work facts',
      works: {
        empty: 'The Studio is preparing the work archive.',
        intro:
          'An evolving record of paintings shaped by inherited memory, human presence and the landscapes of Kyrgyzstan.',
        kicker: 'Selected and archival works',
        title: 'Works',
      },
      year: 'Year',
    },
    ky: {
      articleDetails: 'Макала тууралуу',
      availabilityInquiry: 'Жеткиликтүүлүк тууралуу суроо',
      availableSelection: 'Жеткиликтүү эмгектердин тандалмасы',
      availableWorks: {
        empty: 'Азырынча жеткиликтүү деп белгиленген эмгек жок.',
        intro:
          'Учурда Bekten Studio менен жеткиликтүүлүк тууралуу сүйлөшүүгө ачык эмгектердин тандалмасы.',
        kicker: 'Жеке алуу боюнча суроолор',
        title: 'Жеткиликтүү эмгектер',
      },
      collectionArchive: 'Жыйнактар архиви',
      collectionNote: 'Жыйнак тууралуу',
      collectionWorks: 'Бул жыйнактагы эмгектер',
      collections: {
        empty: 'Студия жыйнактар архивин даярдап жатат.',
        intro:
          'Эстутум, пейзаж, үй-бүлө жана Борбор Азиянын өзгөрүп жаткан маданий турмушу айланасында топтолгон эмгектер.',
        introSecondary:
          'Ар бир жыйнакты ачып, жарыяланган эмгектерди жана маалыматтарды көрүңүз.',
        kicker: 'Жыйнактар',
        title: 'Эстутум, жер жана үй',
      },
      dimensions: 'Өлчөмдөрү',
      detailsFromWork: 'Эмгектин деталдары',
      exhibitedWorks: 'Көргөзмөдөгү эмгектер',
      exhibitionTimeline: 'Көргөзмөлөрдүн тарыхы',
      featuredCollection: 'Тандалган жыйнак',
      featuredExhibition: 'Тандалган көргөзмө',
      featuredJournalEntry: 'Тандалган журнал жазуусу',
      exhibitions: {
        empty: 'Студия көргөзмөлөр архивин даярдап жатат.',
        intro:
          'Бектен Усубалиевдин чыгармачылык тарыхындагы тандалган көргөзмөлөр жана жолугушуулар.',
        kicker: 'Коомдук тарых',
        title: 'Көргөзмөлөр',
      },
      journal: {
        empty: 'Биринчи журналдык жазуу даярдалып жатат.',
        intro: 'Студиядан жана анын жандуу архивинен жазуулар жана окуялар.',
        kicker: 'Студиядан',
        title: 'Журнал',
      },
      journalArchive: 'Журнал архиви',
      medium: 'Материал',
      nextImage: 'Кийинки сүрөт',
      press: {
        empty: 'Басма сөз архиви даярдалып жатат.',
        intro:
          'Сүрөтчүнүн эмгеги тууралуу маектер, очерктер жана көз караштар.',
        kicker: 'Тандалган басылмалар',
        title: 'Басма сөз',
      },
      pressCategories: {
        FEATURE: 'Макалалар',
        INTERVIEW: 'Маектер',
        NEWS: 'Жаңылыктар',
        REVIEW: 'Сын-пикирлер',
      },
      publicationDetails: 'Басылма тууралуу',
      previousImage: 'Мурунку сүрөт',
      readJournal: 'Жазууну окуу',
      readPress: 'Басылманы окуу',
      readAtSource: 'Булактан окуу',
      viewCollection: 'Жыйнакты көрүү',
      viewExhibition: 'Көргөзмөнү көрүү',
      workArchive: 'Эмгектер архиви',
      workFacts: 'Эмгек тууралуу маалымат',
      works: {
        empty: 'Студия эмгектер архивин даярдап жатат.',
        intro:
          'Мураска калган эстутум, адамдын катышуусу жана Кыргызстандын пейзаждары калыптандырган сүрөттөрдүн архиви.',
        kicker: 'Тандалган жана архивдик эмгектер',
        title: 'Эмгектер',
      },
      year: 'Жылы',
    },
    ru: {
      articleDetails: 'О статье',
      availabilityInquiry: 'Запрос о доступности',
      availableSelection: 'Доступные работы',
      availableWorks: {
        empty: 'Сейчас нет работ, отмеченных как доступные.',
        intro:
          'Избранные работы, о доступности которых можно конфиденциально узнать в Bekten Studio.',
        kicker: 'Частные запросы',
        title: 'Доступные работы',
      },
      collectionArchive: 'Архив коллекций',
      collectionNote: 'О коллекции',
      collectionWorks: 'Работы в этой коллекции',
      collections: {
        empty: 'Студия готовит архив коллекций.',
        intro:
          'Циклы работ о памяти, пейзаже, семье и меняющейся культурной жизни Центральной Азии.',
        introSecondary:
          'Откройте каждую коллекцию, чтобы увидеть опубликованные работы и сведения.',
        kicker: 'Коллекции',
        title: 'Память, земля и дом',
      },
      dimensions: 'Размеры',
      detailsFromWork: 'Детали работы',
      exhibitedWorks: 'Работы на выставке',
      exhibitionTimeline: 'Хронология выставок',
      featuredCollection: 'Избранная коллекция',
      featuredExhibition: 'Избранная выставка',
      featuredJournalEntry: 'Избранная запись журнала',
      exhibitions: {
        empty: 'Студия готовит архив выставок.',
        intro:
          'Избранные выставки и встречи из творческой истории Бектена Усубалиева.',
        kicker: 'Публичная история',
        title: 'Выставки',
      },
      journal: {
        empty: 'Первая запись журнала готовится.',
        intro: 'Заметки, истории и наблюдения из студии и ее живого архива.',
        kicker: 'Из студии',
        title: 'Журнал',
      },
      journalArchive: 'Архив журнала',
      medium: 'Материал',
      nextImage: 'Следующее изображение',
      press: {
        empty: 'Архив прессы готовится.',
        intro:
          'Беседы, очерки и опубликованные взгляды на творчество художника.',
        kicker: 'Избранные публикации',
        title: 'Пресса',
      },
      pressCategories: {
        FEATURE: 'Материалы',
        INTERVIEW: 'Интервью',
        NEWS: 'Новости',
        REVIEW: 'Рецензии',
      },
      publicationDetails: 'О публикации',
      previousImage: 'Предыдущее изображение',
      readJournal: 'Читать запись',
      readPress: 'Читать публикацию',
      readAtSource: 'Читать в источнике',
      viewCollection: 'Смотреть коллекцию',
      viewExhibition: 'Смотреть выставку',
      workArchive: 'Архив работ',
      workFacts: 'Сведения о работе',
      works: {
        empty: 'Студия готовит архив работ.',
        intro:
          'Развивающийся архив живописи, сформированной унаследованной памятью, человеческим присутствием и ландшафтами Кыргызстана.',
        kicker: 'Избранные и архивные работы',
        title: 'Работы',
      },
      year: 'Год',
    },
    tr: {
      articleDetails: 'Yazı bilgileri',
      availabilityInquiry: 'Uygunluk talebi',
      availableSelection: 'Uygun eser seçkisi',
      availableWorks: {
        empty: 'Şu anda uygun olarak işaretlenmiş eser bulunmuyor.',
        intro:
          'Bekten Studio ile uygunluk görüşmesine açık olan eserlerden özenli bir seçki.',
        kicker: 'Özel edinim talepleri',
        title: 'Uygun eserler',
      },
      collectionArchive: 'Koleksiyon arşivi',
      collectionNote: 'Koleksiyon notu',
      collectionWorks: 'Bu koleksiyondaki eserler',
      collections: {
        empty: 'Stüdyo koleksiyon arşivini hazırlıyor.',
        intro:
          'Hafıza, coğrafya, aile ve Orta Asya’nın değişen kültürel yaşamı etrafında bir araya gelen eser grupları.',
        introSecondary:
          'Yayımlanan eserleri ve ayrıntıları görmek için koleksiyonları keşfedin.',
        kicker: 'Koleksiyonlar',
        title: 'Hafıza, toprak ve yurt',
      },
      dimensions: 'Ölçüler',
      detailsFromWork: 'Eserden detaylar',
      exhibitedWorks: 'Sergilenen eserler',
      exhibitionTimeline: 'Sergi zaman çizelgesi',
      featuredCollection: 'Öne çıkan koleksiyon',
      featuredExhibition: 'Öne çıkan sergi',
      featuredJournalEntry: 'Öne çıkan journal yazısı',
      exhibitions: {
        empty: 'Stüdyo sergi arşivini hazırlıyor.',
        intro:
          'Bekten Usubaliev’in çalışma tarihinden seçili sergiler, sunumlar ve karşılaşmalar.',
        kicker: 'Kamusal kayıt',
        title: 'Sergiler',
      },
      journal: {
        empty: 'İlk journal yazısı hazırlanıyor.',
        intro:
          'Stüdyodan ve yaşayan arşivinden notlar, hikâyeler ve gözlemler.',
        kicker: 'Stüdyodan',
        title: 'Journal',
      },
      journalArchive: 'Journal arşivi',
      medium: 'Teknik',
      nextImage: 'Sonraki görsel',
      press: {
        empty: 'Basın arşivi hazırlanıyor.',
        intro:
          'Sanatçının üretimi üzerine söyleşiler, yazılar ve yayımlanmış bakışlar.',
        kicker: 'Seçili yayınlar',
        title: 'Basın',
      },
      pressCategories: {
        FEATURE: 'Dosyalar',
        INTERVIEW: 'Söyleşiler',
        NEWS: 'Haberler',
        REVIEW: 'Eleştiriler',
      },
      publicationDetails: 'Yayın bilgileri',
      previousImage: 'Önceki görsel',
      readJournal: 'Yazıyı oku',
      readPress: 'Yayını oku',
      readAtSource: 'Kaynağında oku',
      viewCollection: 'Koleksiyonu gör',
      viewExhibition: 'Sergiyi gör',
      workArchive: 'Eser arşivi',
      workFacts: 'Eser bilgileri',
      works: {
        empty: 'Stüdyo eser arşivini hazırlıyor.',
        intro:
          'Aktarılan hafıza, insan varlığı ve Kırgızistan coğrafyasının şekillendirdiği resimlerin gelişen kaydı.',
        kicker: 'Seçili ve arşiv eserleri',
        title: 'Eserler',
      },
      year: 'Yıl',
    },
  })

function publicDate(value: string, locale: PublicLocale) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(value))
}

export {
  PlainTextBody,
  PublicArchiveSection,
  PublicEditorialList,
  PublicPageIntro,
  editorialMetadata,
  heroMedia,
  listMetadata,
  parsePublicParams,
  publicDate,
  publicRouteCopy,
  secondaryMedia,
}
