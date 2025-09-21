'use client'

import Image from 'next/image'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'

import {LaptopIcon, LogInIcon, MoonIcon, SunIcon, WavesIcon} from 'lucide-react'
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

import {Button} from '../ui/button'

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

  const handleThemeChange = (newTheme: string) => {
    try {
      console.log('Changing theme from', theme, 'to', newTheme)
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
      className={cn(
        'fixed top-2 right-2 z-[60] mb-0 flex gap-1 rounded backdrop-blur-sm lg:right-4',
        className,
      )}
    >
      {user ? (
        <Link
          href={`/profile/${user.id}`}
          className="flex items-center space-x-2 transition-opacity hover:opacity-80"
        >
          <span className="text-muted-foreground hidden text-sm md:block">
            {user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              'Profile'}
          </span>
          <Image
            src={user?.user_metadata?.avatar_url || '/img/cinema.png'}
            width={24}
            height={24}
            alt="user avatar"
            className="border-border h-9 w-9 rounded border object-cover"
          />
        </Link>
      ) : (
        <Link href="/sign-in">
          <Button
            variant="outline"
            size="sm"
            className="border-border bg-card text-foreground hover:bg-muted relative z-50 h-9 w-9 justify-center gap-2 rounded border text-xs uppercase transition-colors sm:w-fit"
          >
            <LogInIcon className="h-4 w-4" />
            <span className="hidden md:block">Sign In</span>
          </Button>
        </Link>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
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
            <DropdownMenuLabel
              key={cur}
              onClick={() => onSelectChange(cur)}
              className={cn(
                'text-popover-foreground hover:bg-muted/80 focus:bg-muted/80 cursor-pointer rounded-sm px-2 py-1.5 text-center text-xs font-thin uppercase transition-colors',
                locale === cur && 'bg-muted/60 font-semibold',
              )}
            >
              {t('branding.locale', {locale: cur})}
            </DropdownMenuLabel>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'border-border bg-card text-foreground hover:bg-muted relative z-50 flex h-9 w-9 items-center justify-center rounded border transition-colors',
          )}
          title={`Current theme: ${theme || 'system'} - Click to change`}
        >
          {themeIconMap[theme || 'system'] || <LaptopIcon className="w-3" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="bg-background! border-border! text-popover-foreground flex flex-col gap-1 rounded-sm shadow-lg"
          align="end"
        >
          <DropdownMenuLabel
            onClick={() => handleThemeChange('light')}
            className={cn(
              'text-popover-foreground hover:bg-muted/80 focus:bg-muted/80 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-center text-xs font-thin uppercase transition-colors',
              theme === 'light' && 'bg-muted/60 font-semibold',
            )}
          >
            <SunIcon className="h-4 w-4" />
            <span>Light</span>
          </DropdownMenuLabel>
          <DropdownMenuLabel
            onClick={() => handleThemeChange('dark')}
            className={cn(
              'text-popover-foreground hover:bg-muted/80 focus:bg-muted/80 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-center text-xs font-thin uppercase transition-colors',
              theme === 'dark' && 'bg-muted/60 font-semibold',
            )}
          >
            <MoonIcon className="h-4 w-4" />
            <span>Dark</span>
          </DropdownMenuLabel>
          <DropdownMenuLabel
            onClick={() => handleThemeChange('navy')}
            className={cn(
              'text-popover-foreground hover:bg-muted/80 focus:bg-muted/80 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-center text-xs font-thin uppercase transition-colors',
              theme === 'navy' && 'bg-muted/60 font-semibold',
            )}
          >
            <WavesIcon className="h-4 w-4" />
            <span>Navy</span>
          </DropdownMenuLabel>
          <DropdownMenuLabel
            onClick={() => handleThemeChange('system')}
            className={cn(
              'text-popover-foreground hover:bg-muted/80 focus:bg-muted/80 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-center text-xs font-thin uppercase transition-colors',
              theme === 'system' && 'bg-muted/60 font-semibold',
            )}
          >
            <LaptopIcon className="h-4 w-4" />
            <span>System</span>
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  )
}
