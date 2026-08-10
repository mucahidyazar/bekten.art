'use client'

import Image from 'next/image'
import Link from 'next/link'

import {useLocale, useTranslations} from 'next-intl'
import {useEffect, useState} from 'react'

import {Navbar} from '@/components/navbar'
import {localizedPath} from '@/lib/localized-path'
import {cn} from '@/utils'

import {AppTools} from '../molecules/app-tools'

import type {AppLocale} from '@/lib/localized-path'

function HeaderClient() {
  const [isScrolled, setIsScrolled] = useState(false)
  const locale = useLocale() as AppLocale
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
          'app-container relative flex w-full flex-col',
          isScrolled
            ? 'md:flex-row md:items-center md:justify-between md:py-4!'
            : '',
        )}
      >
        <AppTools className={cn(isScrolled ? 'md:static md:order-3' : '')} />
        <aside
          className={cn(
            'mb-4 flex flex-col items-center',
            isScrolled ? 'md:mb-0' : '',
          )}
        >
          <Link href={localizedPath(locale, '/')}>
            <Image
              src="/svg/full-logo.svg"
              alt={t('header.logoAlt')}
              width={120}
              height={40}
              priority
              className="mb-4 cursor-pointer"
            />
          </Link>
          <p
            className={cn(
              'font-signature text-muted-foreground text-center text-xs uppercase',
            )}
          >
            {t('branding.slogan')}
          </p>
        </aside>
        <Navbar
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
