import Link from 'next/link'

import {useLocale, useTranslations} from 'next-intl'

import {ME, SocialLinks} from '@/constants'
import {localizedPath} from '@/lib/localized-path'
import {cn} from '@/utils'
import {getSocialLink} from '@/utils/get-social-link'

import {Icons} from './ui/icons'

import type {AppLocale} from '@/lib/localized-path'

type FooterProps = {
  className?: string
}
export function Footer({className}: FooterProps) {
  const t = useTranslations()
  const locale = useLocale() as AppLocale

  return (
    <footer
      className={cn(
        'text-muted-foreground hidden text-xs lg:flex lg:flex-col lg:gap-2',
        className,
      )}
    >
      <div className="flex gap-4 py-2">
        {Object.entries(ME.social).map(([platform, id]) => {
          const IconComponent = (Icons as any)[platform]

          return (
            <a
              key={platform}
              href={getSocialLink(platform as SocialLinks, id)}
              aria-label={socialLinkLabels[platform] ?? platform}
              className="hover:text-primary-900 flex items-center gap-2 transition-all duration-300 ease-in-out hover:scale-125"
              target="_blank"
              rel="noopener noreferrer"
            >
              {IconComponent && <IconComponent className="w-4" />}
            </a>
          )
        })}
      </div>
      <p>
        {t('legal.copyRight', {year: new Date().getFullYear()})}{' '}
        <a
          href="https://mucahid.dev"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:text-primary/80 inline transition-colors duration-200 hover:underline"
        >
          mucahid.dev
        </a>
      </p>
      <ul className="flex flex-wrap items-center gap-2 text-[10px]">
        <li className="hover:text-primary-500 duration-150">
          <Link href={localizedPath(locale, '/privacy-policy')}>
            {t('legal.privacyPolicy')}
          </Link>
        </li>
        <li className="hover:text-primary-500 duration-150">
          <Link href={localizedPath(locale, '/terms-of-service')}>
            {t('legal.termsOfService')}
          </Link>
        </li>
      </ul>
    </footer>
  )
}

const socialLinkLabels: Readonly<Record<string, string>> = {
  instagram: 'Instagram',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
}
