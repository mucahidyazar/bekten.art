'use client'
import {LaptopIcon, LogInIcon, MoonIcon, SunIcon, WavesIcon} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {useLocale, useTranslations} from 'next-intl'
import {useTheme} from 'next-themes'
import {useEffect, useState, useTransition} from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {LOCALE, LOCALES} from '@/constants'
import {cn} from '@/utils'

import { Button } from '../ui/button'



type AppToolsProps = {
  className?: string
  user?: any
}
export function AppTools({className, user}: AppToolsProps) {
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const {setTheme, theme} = useTheme()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

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

  const themeIconMap = {
    light: <SunIcon className="w-3" />,
    dark: <MoonIcon className="w-3" />,
    navy: <WavesIcon className="w-3" />,
    system: <LaptopIcon className="w-3" />,
  } as {[key: string]: React.ReactNode}

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <section
        id="app-tools"
        className={cn(
          'fixed right-2 top-2 z-[60] flex gap-1 rounded bg-background/80 backdrop-blur-sm lg:right-4',
          className,
        )}
      >
        <div className="h-9 w-9 rounded border border-border bg-card" />
        <div className="h-9 w-9 rounded border border-border bg-card" />
        <div className="h-9 w-9 rounded border border-border bg-card" />
      </section>
    )
  }

  return (
    <section
      id="app-tools"
      className={cn(
        'fixed right-2 top-2 z-[60] flex gap-1 rounded bg-background/80 backdrop-blur-sm lg:right-4',
        className,
      )}
    >
      {user ? (
        <Link href={`/profile/${user.id}`} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <span className="hidden md:block text-sm text-muted-foreground">
            {user.user_metadata?.full_name || user.user_metadata?.name || 'Profile'}
          </span>
          <Image
            src={user?.user_metadata?.avatar_url || '/img/cinema.png'}
            width={24}
            height={24}
            alt="user avatar"
            className="h-9 w-9 rounded border border-border object-cover"
          />
        </Link>
      ) : (
        <Link href="/sign-in">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <LogInIcon className="w-4 h-4" />
            <span>Sign In</span>
          </Button>
        </Link>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'relative z-50 flex h-9 w-9 items-center justify-center rounded border border-border bg-card text-xs uppercase text-foreground hover:bg-muted transition-colors',
          )}
        >
          {isPending ? '...' : locale}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {locales.map(cur => (
            <DropdownMenuLabel
              key={cur}
              onClick={() => onSelectChange(cur)}
              className="cursor-pointer text-center text-xs font-thin uppercase text-foreground hover:bg-muted"
            >
              {t('locale', {locale: cur})}
            </DropdownMenuLabel>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        className={cn(
          'relative z-50 flex h-9 w-9 items-center justify-center rounded border border-border bg-card text-foreground hover:bg-muted transition-colors',
        )}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          
          const themes = ['light', 'dark', 'navy', 'system']
          const currentIndex = themes.indexOf(theme || 'system')
          const nextIndex = (currentIndex + 1) % themes.length
          const nextTheme = themes[nextIndex]
          
          if (setTheme) {
            setTheme(nextTheme)
          }
        }}
        title={`Current theme: ${theme || 'system'}`}
      >
        {themeIconMap[theme || 'system'] || <LaptopIcon className="w-3" />}
      </button>
    </section>
  )
}
