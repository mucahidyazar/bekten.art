'use client'
import {MoonIcon, SunIcon} from '@heroicons/react/24/outline'
import {usePathname, useRouter} from 'next/navigation'
import {useLocale, useTranslations} from 'next-intl'
import {useState, useTransition} from 'react'

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
}
export function AppTools({className}: AppToolsProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
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
    <section
      className={cn(
        'flex gap-1 fixed rounded top-2 right-2 lg:right-4 z-20 bg-white bg-opacity-60',
        className,
      )}
    >
      <ReactPlayer />

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'w-9 h-9 flex items-center justify-center border border-primary-500 border-opacity-10 rounded bg-primary-500 bg-opacity-5 shadow-soft-md hover:shadow-soft-lg text-primary-500 z-50 relative text-xs uppercase',
          )}
        >
          {isPending ? '...' : locale}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {locales.map(cur => (
            <DropdownMenuLabel
              key={cur}
              onClick={() => onSelectChange(cur)}
              className="cursor-pointer text-primary-500 font-thin text-xs text-center uppercase hover:bg-primary-500 hover:bg-opacity-5"
            >
              {t('locale', {locale: cur})}
            </DropdownMenuLabel>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        className={cn(
          'w-9 h-9 flex items-center justify-center border border-primary-500 border-opacity-10 rounded bg-primary-500 bg-opacity-5 shadow-soft-md hover:shadow-soft-lg text-primary-500 z-50 relative',
        )}
      >
        {theme === 'dark' ? (
          <SunIcon className="w-3" onClick={() => setTheme('light')} />
        ) : (
          <MoonIcon className="w-3" onClick={() => setTheme('dark')} />
        )}
      </button>
    </section>
  )
}
