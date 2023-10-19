'use client'
import {usePathname, useRouter} from 'next/navigation'
import {useLocale, useTranslations} from 'next-intl'
import {useTransition} from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {LOCALE, LOCALES} from '@/constants'
import {cn} from '@/utils'

import {ReactPlayer} from './ReactPlayer'

type AppToolsProps = {
  className?: string
  withoutBg?: boolean
}
export function AppTools({className, withoutBg}: AppToolsProps) {
  const [isPending, startTransition] = useTransition()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const locales = LOCALES.filter(l => l !== locale)

  function onSelectChange(newLocale: keyof typeof LOCALE) {
    startTransition(() => {
      const hasPrefix = pathname.startsWith(`/${locale}`)
      if (hasPrefix) {
        router.push(pathname.replace(`/${locale}`, `/${newLocale}`))
      } else {
        router.push(`/${newLocale}/${pathname}`)
      }
    })
  }

  return (
    <section className={cn('flex gap-1', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'w-9 h-9 flex items-center justify-center border border-primary-500 border-opacity-10 rounded-full bg-primary-500 bg-opacity-5 shadow-soft-md hover:shadow-soft-lg text-primary-500 z-50 relative text-xs uppercase',
            !!withoutBg &&
              'hover:shadow-none shadow-none bg-none border-none bg-opacity-0 w-fit',
          )}
        >
          {isPending ? '...' : locale}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {locales.map(cur => (
            <DropdownMenuLabel
              key={cur}
              onClick={() => onSelectChange(cur)}
              className="cursor-pointer"
            >
              {t('locale', {locale: cur})}
            </DropdownMenuLabel>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReactPlayer withoutBg={withoutBg} />
    </section>
  )
}
