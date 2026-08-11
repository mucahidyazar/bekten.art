import Image from 'next/image'
import Link from 'next/link'

import {localizedPath} from '@/lib/localized-path'

import {publicShellCopy, type PublicLocale} from './public-copy'

type PublicFooterProps = Readonly<{locale: PublicLocale}>

export function PublicFooter({locale}: PublicFooterProps) {
  const copy = publicShellCopy[locale]

  return (
    <footer className="heritage-footer heritage-reference-footer">
      <div className="heritage-shell heritage-footer__primary">
        <div className="heritage-footer__statement">
          <p className="heritage-kicker">Bekten Studio · Bishkek</p>
          <h2>{copy.footerHeading}</h2>
          <p>{copy.footerBody}</p>
        </div>

        <div className="heritage-footer__actions">
          <Link href={localizedPath(locale, '/available-works')}>
            {copy.availability}
          </Link>
          <Link href={localizedPath(locale, '/commission-a-work')}>
            {copy.commission}
          </Link>
          <Link href={localizedPath(locale, '/private-viewings')}>
            {copy.privateViewing}
          </Link>
          <Link href={localizedPath(locale, '/contact')}>{copy.contact}</Link>
        </div>
      </div>

      <div className="heritage-shell heritage-footer__legal">
        <Link
          aria-label={`Bekten — ${copy.home}`}
          className="heritage-footer__logo"
          href={localizedPath(locale, '/')}
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
        <span>© {new Date().getFullYear()} Bekten</span>
        <span>{copy.copyright}</span>
        <div>
          <Link href={localizedPath(locale, '/privacy-policy')}>
            {copy.privacy}
          </Link>
          <Link href={localizedPath(locale, '/press')}>{copy.press}</Link>
        </div>
      </div>
    </footer>
  )
}
