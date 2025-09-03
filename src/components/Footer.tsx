import Link from 'next/link'
import {useTranslations} from 'next-intl'

import {ME, SocialLinks} from '@/constants'
import {cn} from '@/utils'
import {getSocialLink} from '@/utils/getSocialLink'

import {AppTools} from './molecules/AppTools'
import {Icons} from './ui/icons'

type FooterProps = {
  className?: string
}
export function Footer({className}: FooterProps) {
  const t = useTranslations()

  return (
    <footer
      className={cn(
        'hidden text-xs text-gray-400 lg:flex lg:flex-col lg:gap-2',
        className,
      )}
    >
      <AppTools className="static lg:hidden" />
      <div className="flex gap-4 py-2">
        {Object.entries(ME.social).map(([platform, id]) => {
          const IconComponent = (Icons as any)[platform]
          return (
            <a
              key={platform}
              href={getSocialLink(platform as SocialLinks, id)}
              className="flex items-center gap-2 transition-all duration-300 ease-in-out hover:scale-125 hover:text-primary-900"
              target="_blank"
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
          className="inline text-primary hover:text-primary/80 transition-colors duration-200 hover:underline"
        >
          mucahid.dev
        </a>
      </p>
      <ul className="flex flex-wrap items-center gap-2 text-[10px]">
        <li className="duration-150 hover:text-primary-500">
          <Link href="/privacy-policy">{t('legal.privacyPolicy')}</Link>
        </li>
        <li className="duration-150 hover:text-primary-500">
          <Link href="/terms-of-service">{t('legal.termsOfService')}</Link>
        </li>
      </ul>
    </footer>
  )
}
