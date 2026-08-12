import Image from 'next/image'
import Link from 'next/link'

import {localizedPath} from '@/lib/localized-path'

import {
  publicCopyLocale,
  publicShellCopyFor,
  type BuiltInPublicLocale,
} from './public-copy'
import styles from './public-footer.module.css'
import {
  NAV_BACK_TRANSITION,
  NAV_LATERAL_TRANSITION,
} from './public-view-transition'

type PublicFooterProps = Readonly<{locale: string}>

const footerNavigationCopy: Readonly<
  Record<
    BuiltInPublicLocale,
    Readonly<{
      allWorks: string
      availableWorks: string
      archiveNavigation: string
      workNavigation: string
    }>
  >
> = Object.freeze({
  en: {
    allWorks: 'All works',
    archiveNavigation: 'Footer archive navigation',
    availableWorks: 'Available works',
    workNavigation: 'Footer work navigation',
  },
  ky: {
    allWorks: 'Бардык эмгектер',
    archiveNavigation: 'Футердеги архив навигациясы',
    availableWorks: 'Жеткиликтүү эмгектер',
    workNavigation: 'Футердеги эмгектер навигациясы',
  },
  ru: {
    allWorks: 'Все работы',
    archiveNavigation: 'Архивная навигация в подвале',
    availableWorks: 'Доступные работы',
    workNavigation: 'Навигация по работам в подвале',
  },
  tr: {
    allWorks: 'Tüm eserler',
    archiveNavigation: 'Alt bilgi arşiv navigasyonu',
    availableWorks: 'Mevcut eserler',
    workNavigation: 'Alt bilgi eser navigasyonu',
  },
})

export function PublicFooter({locale}: PublicFooterProps) {
  const copy = publicShellCopyFor(locale)
  const navigationCopy = footerNavigationCopy[publicCopyLocale(locale)]

  return (
    <footer
      className="heritage-footer heritage-reference-footer"
      style={{viewTransitionName: 'persistent-footer'}}
    >
      <div className="heritage-shell heritage-footer__primary">
        <div className="heritage-footer__statement">
          <p className="heritage-kicker">Bekten Studio · Bishkek</p>
          <h2>{copy.footerHeading}</h2>
          <p>{copy.footerBody}</p>
        </div>

        <div className="heritage-footer__actions">
          <Link
            href={localizedPath(locale, '/available-works')}
            transitionTypes={[...NAV_LATERAL_TRANSITION]}
          >
            {copy.availability}
          </Link>
          <Link
            href={localizedPath(locale, '/commission-a-work')}
            transitionTypes={[...NAV_LATERAL_TRANSITION]}
          >
            {copy.commission}
          </Link>
          <Link
            href={localizedPath(locale, '/private-viewings')}
            transitionTypes={[...NAV_LATERAL_TRANSITION]}
          >
            {copy.privateViewing}
          </Link>
          <Link
            href={localizedPath(locale, '/contact')}
            transitionTypes={[...NAV_LATERAL_TRANSITION]}
          >
            {copy.contact}
          </Link>
        </div>
      </div>

      <div className={`heritage-shell ${styles.navigation}`}>
        <Link
          aria-label={`Bekten — ${copy.home}`}
          className={`heritage-footer__logo ${styles.logo}`}
          href={localizedPath(locale, '/')}
          transitionTypes={[...NAV_BACK_TRANSITION]}
        >
          <Image
            alt=""
            aria-hidden="true"
            height={32}
            src="/svg/full-logo.svg"
            unoptimized
            width={120}
          />
        </Link>

        <nav
          aria-label={navigationCopy.workNavigation}
          className={styles.workNavigation}
        >
          <Link
            href={localizedPath(locale, '/works')}
            transitionTypes={[...NAV_LATERAL_TRANSITION]}
          >
            {navigationCopy.allWorks}
          </Link>
          <Link
            href={localizedPath(locale, '/available-works')}
            transitionTypes={[...NAV_LATERAL_TRANSITION]}
          >
            {navigationCopy.availableWorks}
          </Link>
          <Link
            href={localizedPath(locale, '/commission-a-work')}
            transitionTypes={[...NAV_LATERAL_TRANSITION]}
          >
            {copy.commission}
          </Link>
        </nav>

        <nav
          aria-label={navigationCopy.archiveNavigation}
          className={styles.legalNavigation}
        >
          <Link
            href={localizedPath(locale, '/collectors')}
            transitionTypes={[...NAV_LATERAL_TRANSITION]}
          >
            {copy.collectors}
          </Link>
          <Link
            href={localizedPath(locale, '/exhibitions')}
            transitionTypes={[...NAV_LATERAL_TRANSITION]}
          >
            {copy.exhibitions}
          </Link>
          <Link
            href={localizedPath(locale, '/journal')}
            transitionTypes={[...NAV_LATERAL_TRANSITION]}
          >
            {copy.journal}
          </Link>
          <Link
            href={localizedPath(locale, '/press')}
            transitionTypes={[...NAV_LATERAL_TRANSITION]}
          >
            {copy.press}
          </Link>
          <Link
            href={localizedPath(locale, '/privacy-policy')}
            transitionTypes={[...NAV_LATERAL_TRANSITION]}
          >
            {copy.privacy}
          </Link>
        </nav>
      </div>

      <div className={`heritage-shell ${styles.attribution}`}>
        <p>
          Made with 💜 by{' '}
          <a
            href="https://mucahid.dev/"
            rel="noopener noreferrer"
            target="_blank"
          >
            mucahid.dev
          </a>{' '}
          for bekten.art
        </p>
      </div>
    </footer>
  )
}
