import type {Metadata} from 'next'

import styles from '@/components/public-site/catalog-layouts.module.css'
import {PublicArtworkGrid} from '@/components/public-site/public-artwork-grid'
import {
  publicCopyLocale,
  publicLocale,
  type BuiltInPublicLocale,
} from '@/components/public-site/public-copy'
import {localizedPath} from '@/lib/localized-path'
import {publicEditorialReader} from '@/server/public-editorial'
import {prepareMetadata} from '@/utils/prepare-metadata'

import {
  PublicArchiveSection,
  PublicPageIntro,
} from '../works/public-route-helpers'

type ArchivePageProps = Readonly<{params: Promise<{locale: string}>}>

const archiveCopy: Readonly<
  Record<
    BuiltInPublicLocale,
    Readonly<{
      description: string
      empty: string
      eyebrow: string
      title: string
      undated: string
      workCount: (count: number) => string
      worksFrom: (year: string) => string
    }>
  >
> = Object.freeze({
  en: {
    description:
      'A chronological record of published works held across collections, exhibitions and private archives.',
    empty: 'The published archive is being prepared by the Studio.',
    eyebrow: 'Works across time',
    title: 'Archive',
    undated: 'Undated',
    workCount: count => `${count} ${count === 1 ? 'work' : 'works'}`,
    worksFrom: year => `Works from ${year}`,
  },
  ky: {
    description:
      'Жыйнактарда, көргөзмөлөрдө жана жеке архивдерде сакталган жарыяланган эмгектердин хронологиялык жазмасы.',
    empty: 'Жарыяланган архивди студия даярдап жатат.',
    eyebrow: 'Мезгилдердеги эмгектер',
    title: 'Архив',
    undated: 'Датасы көрсөтүлгөн эмес',
    workCount: count => `${count} эмгек`,
    worksFrom: year => `${year} жылдагы эмгектер`,
  },
  ru: {
    description:
      'Хронология опубликованных работ из коллекций, выставок и частных архивов.',
    empty: 'Студия готовит опубликованный архив.',
    eyebrow: 'Работы разных лет',
    title: 'Архив',
    undated: 'Без даты',
    workCount: count => `${count} работ`,
    worksFrom: year => `Работы за ${year} год`,
  },
  tr: {
    description:
      'Koleksiyonlarda, sergilerde ve özel arşivlerde yer alan yayımlanmış eserlerin kronolojik kaydı.',
    empty: 'Yayımlanmış arşiv stüdyo tarafından hazırlanıyor.',
    eyebrow: 'Yıllar boyunca eserler',
    title: 'Arşiv',
    undated: 'Tarihsiz',
    workCount: count => `${count} eser`,
    worksFrom: year => `${year} yılı eserleri`,
  },
})

export async function generateMetadata({
  params,
}: ArchivePageProps): Promise<Metadata> {
  const locale = publicLocale((await params).locale)
  const copy = archiveCopy[publicCopyLocale(locale)]

  return prepareMetadata({
    alternates: {canonical: localizedPath(locale, '/archive')},
    contentLocale: locale,
    description: copy.description,
    title: copy.title,
  })
}

export default async function ArchivePage({params}: ArchivePageProps) {
  const locale = publicLocale((await params).locale)
  const contentLocale = publicCopyLocale(locale)
  const copy = archiveCopy[contentLocale]
  const works = await publicEditorialReader.listWorks(contentLocale)
  const yearGroups = [...new Set(works.map(work => work.year ?? null))]
    .sort((left, right) => {
      if (left === null) return 1
      if (right === null) return -1

      return right - left
    })
    .map(year => ({
      label: year === null ? copy.undated : String(year),
      works: works.filter(work => (work.year ?? null) === year),
    }))

  return (
    <div className={styles.page}>
      <PublicPageIntro
        illustration="landscape"
        intro={copy.description}
        kicker={copy.eyebrow}
        title={copy.title}
      />

      <PublicArchiveSection light>
        {yearGroups.length > 0 ? (
          yearGroups.map(group => (
            <section
              aria-label={copy.worksFrom(group.label)}
              className={styles.yearSection}
              key={group.label}
            >
              <div className={styles.yearHeader}>
                <h2>{group.label}</h2>
                <span aria-hidden="true" />
                <p>{copy.workCount(group.works.length)}</p>
              </div>
              <PublicArtworkGrid locale={locale} works={group.works} />
            </section>
          ))
        ) : (
          <p role="status">{copy.empty}</p>
        )}
      </PublicArchiveSection>
    </div>
  )
}
