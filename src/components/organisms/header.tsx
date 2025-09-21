'use client'

import {Nanum_Brush_Script} from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'

import {useTranslations} from 'next-intl'
import {useEffect, useState} from 'react'

import {Navbar} from '@/components/navbar'
import {cn} from '@/utils'
import {EnhancedUser} from '@/utils/supabase/server'

import {AppTools} from '../molecules/app-tools'

const nanum = Nanum_Brush_Script({
  subsets: ['latin'],
  weight: ['400'],
})

interface HeaderProps {
  user: EnhancedUser | null
}

function HeaderClient({user}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const t = useTranslations()

  useEffect(() => {
    const handleScroll = () => {
      // Layout içindeki scroll container'ı bul
      const scrollContainer = document.querySelector('#layout-wrapper')

      if (scrollContainer) {
        const scrollY = scrollContainer.scrollTop

        setIsScrolled(scrollY > 64)
      }
    }

    // Layout içindeki scroll container'ı bul ve event listener ekle
    const scrollContainer = document.querySelector('#layout-wrapper')

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)

      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <header
      className={cn(
        'border-border/40 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur transition-colors duration-300',
      )}
    >
      <div
        className={cn(
          'relative container flex w-full flex-col',
          isScrolled
            ? 'md:flex-row md:items-center md:justify-between md:py-4!'
            : '',
        )}
      >
        <AppTools
          user={user}
          className={cn(isScrolled ? 'md:static md:order-3' : '')}
        />
        <aside
          className={cn(
            'mb-4 flex flex-col items-center',
            isScrolled ? 'md:mb-0' : '',
          )}
        >
          <Link href="/">
            <Image
              src="/svg/full-logo.svg"
              alt={t('header.logoAlt')}
              width={120}
              height={40}
              priority
              className="mb-4 h-auto w-30 cursor-pointer"
            />
          </Link>
          <p
            className={cn(
              nanum.className,
              'text-muted-foreground text-center text-xs uppercase',
            )}
          >
            {t('branding.slogan')}
          </p>
        </aside>
        <Navbar
          user={user}
          className={cn(
            isScrolled
              ? 'md:absolute md:top-1/2 md:right-0 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2'
              : '',
          )}
        />
      </div>
    </header>
  )
}

export {HeaderClient as Header}
