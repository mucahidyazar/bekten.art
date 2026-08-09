'use client'

import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'

import {LaptopIcon, LogInIcon, MoonIcon, SunIcon, WavesIcon} from 'lucide-react'
import {useLocale, useTranslations} from 'next-intl'
import {useTheme} from 'next-themes'
import {useTransition} from 'react'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {LOCALE, LOCALES} from '@/constants'
import {useHydrated} from '@/hooks/use-hydrated'
import {localizedPath} from '@/lib/localized-path'
import {cn} from '@/utils'

import {buttonVariants} from '../ui/button'

import type {AppLocale} from '@/lib/localized-path'
import type {UiUser} from '@/types/ui-user'

type AppToolsProps = {
  className?: string
  user?: UiUser | null
}
export function AppTools({className, user}: AppToolsProps) {
  const [isPending, startTransition] = useTransition()
  const mounted = useHydrated()
  const t = useTranslations()
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const pathname = usePathname()
  const {setTheme, theme} = useTheme()

  const handleThemeChange = (newTheme: string) => {
    try {
      setTheme(newTheme)

      // Force update document class for immediate visual feedback
      if (typeof window !== 'undefined' && mounted) {
        const htmlElement = document.documentElement

        htmlElement.classList.remove('light', 'dark', 'navy')
        if (newTheme !== 'system') {
          htmlElement.classList.add(newTheme)
        }
      }
    } catch (error) {
      console.error('Error setting theme:', error)
    }
  }

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
    light: <SunIcon aria-hidden="true" className="w-3" />,
    dark: <MoonIcon aria-hidden="true" className="w-3" />,
    navy: <WavesIcon aria-hidden="true" className="w-3" />,
    system: <LaptopIcon aria-hidden="true" className="w-3" />,
  } as {[key: string]: React.ReactNode}

  if (!mounted) {
    return (
      <section
        id="app-tools"
        aria-hidden="true"
        className={cn(
          'fixed top-2 right-2 z-[60] flex gap-1 rounded backdrop-blur-sm lg:right-4',
          className,
        )}
      >
        <div className="border-border bg-card h-9 w-9 rounded border" />
        <div className="border-border bg-card h-9 w-9 rounded border" />
        <div className="border-border bg-card h-9 w-9 rounded border" />
      </section>
    )
  }

  return (
    <section
      id="app-tools"
      aria-label="Display and account tools"
      className={cn(
        'fixed top-2 right-2 z-[60] mb-0 flex gap-1 rounded lg:right-4',
        className,
      )}
    >
      {user ? (
        <Link
          href={localizedPath(locale, `/profile/${user.id}`)}
          className="flex items-center space-x-2 transition-opacity hover:opacity-80"
        >
          <span className="text-muted-foreground hidden text-sm md:block">
            {user.name || 'Profile'}
          </span>
          <Avatar className="border-border h-9 w-9 border">
            {user.image ? (
              <AvatarImage alt={user.name || 'User avatar'} src={user.image} />
            ) : null}
            <AvatarFallback aria-hidden="true">
              {(user.name || user.email || 'P').trim().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Link
          href={localizedPath(locale, '/sign-in')}
          aria-label={t('navigation.signIn')}
          className={cn(
            buttonVariants({variant: 'outline', size: 'sm'}),
            'border-border bg-card text-foreground hover:bg-muted relative z-50 h-9 w-9 justify-center gap-2 rounded border text-xs uppercase transition-colors sm:w-fit',
          )}
        >
          <LogInIcon aria-hidden="true" className="h-4 w-4" />
          <span className="hidden md:block">{t('navigation.signIn')}</span>
        </Link>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Change language. Current language: ${t('branding.locale', {locale})}`}
          className={cn(
            'border-border bg-card text-foreground hover:bg-muted relative z-50 flex h-9 w-9 items-center justify-center rounded border text-xs uppercase transition-colors',
          )}
        >
          {isPending ? '...' : locale}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="bg-background! border-border! text-popover-foreground flex flex-col gap-1 rounded-sm shadow-lg"
          align="end"
        >
          {LOCALES.map(cur => (
            <DropdownMenuItem
              key={cur}
              aria-current={locale === cur ? 'true' : undefined}
              onSelect={() => onSelectChange(cur)}
              className={cn(
                'text-popover-foreground hover:bg-muted/80 focus:bg-muted/80 cursor-pointer rounded-sm px-2 py-1.5 text-center text-xs font-thin uppercase transition-colors',
                locale === cur && 'bg-muted/60 font-semibold',
              )}
            >
              {t('branding.locale', {locale: cur})}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Change color theme. Current theme: ${theme || 'system'}`}
          className={cn(
            'border-border bg-card text-foreground hover:bg-muted relative z-50 flex h-9 w-9 items-center justify-center rounded border transition-colors',
          )}
        >
          {themeIconMap[theme || 'system'] || (
            <LaptopIcon aria-hidden="true" className="w-3" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="bg-background! border-border! text-popover-foreground flex flex-col gap-1 rounded-sm shadow-lg"
          align="end"
        >
          <DropdownMenuItem
            aria-current={theme === 'light' ? 'true' : undefined}
            onSelect={() => handleThemeChange('light')}
            className={cn(
              'text-popover-foreground hover:bg-muted/80 focus:bg-muted/80 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-center text-xs font-thin uppercase transition-colors',
              theme === 'light' && 'bg-muted/60 font-semibold',
            )}
          >
            <SunIcon aria-hidden="true" className="h-4 w-4" />
            <span>Light</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            aria-current={theme === 'dark' ? 'true' : undefined}
            onSelect={() => handleThemeChange('dark')}
            className={cn(
              'text-popover-foreground hover:bg-muted/80 focus:bg-muted/80 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-center text-xs font-thin uppercase transition-colors',
              theme === 'dark' && 'bg-muted/60 font-semibold',
            )}
          >
            <MoonIcon aria-hidden="true" className="h-4 w-4" />
            <span>Dark</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            aria-current={theme === 'navy' ? 'true' : undefined}
            onSelect={() => handleThemeChange('navy')}
            className={cn(
              'text-popover-foreground hover:bg-muted/80 focus:bg-muted/80 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-center text-xs font-thin uppercase transition-colors',
              theme === 'navy' && 'bg-muted/60 font-semibold',
            )}
          >
            <WavesIcon aria-hidden="true" className="h-4 w-4" />
            <span>Navy</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            aria-current={theme === 'system' ? 'true' : undefined}
            onSelect={() => handleThemeChange('system')}
            className={cn(
              'text-popover-foreground hover:bg-muted/80 focus:bg-muted/80 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-center text-xs font-thin uppercase transition-colors',
              theme === 'system' && 'bg-muted/60 font-semibold',
            )}
          >
            <LaptopIcon aria-hidden="true" className="h-4 w-4" />
            <span>System</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  )
}
