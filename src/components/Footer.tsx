import {useTranslations} from 'next-intl'

import {LINKS} from '@/mocks'
import {cn} from '@/utils'

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
      <div className="flex gap-4">
        {LINKS.map(link => {
          const IconComponent = (Icons as any)[link?.icon]
          return (
            <a
              key={link.icon}
              href={link.url}
              className="flex items-center gap-2 transition-all duration-300 ease-in-out hover:scale-125 hover:text-primary-900"
              target="_blank"
            >
              {IconComponent && <IconComponent className="w-4" />}
            </a>
          )
        })}
      </div>
      <p>
        {t('copyRight', {year: new Date().getFullYear()})}{' '}
        {/* <a
          href="https://mucahid.dev"
          target="_blank"
          rel="noreferrer"
          className="inline"
        >
          <span className="text-primary-500 text-opacity-50">mucahid.dev</span>
        </a> */}
      </p>
      <ul className="flex flex-wrap items-center gap-2 text-[10px]">
        <li className="duration-150 hover:text-primary-500">
          <a href="/privacy-policy">{t('privacyPolicy')}</a>
        </li>
        <li className="duration-150 hover:text-primary-500">
          <a href="/terms-of-use">{t('termsOfUse')}</a>
        </li>
      </ul>
    </footer>
  )
}
