'use client'

import Link from 'next/link'

import {ArrowRightIcon, PaletteIcon, MailIcon, HeartIcon} from 'lucide-react'
import {useTranslations} from 'next-intl'

import {Button} from '@/components/ui/button'

interface CallToActionProps {
  title?: string
  description?: string
  primaryButtonText?: string
  primaryButtonHref?: string
  secondaryButtonText?: string
  secondaryButtonHref?: string
  iconName?: 'palette' | 'mail' | 'heart'
  className?: string
}

export function CallToAction({
  title,
  description,
  primaryButtonText,
  primaryButtonHref = '/gallery',
  secondaryButtonText,
  secondaryButtonHref = '/contact',
  iconName = 'palette',
  className = '',
}: CallToActionProps) {
  const t = useTranslations('cta.default')
  const iconMap = {
    palette: PaletteIcon,
    mail: MailIcon,
    heart: HeartIcon,
  }

  const IconComponent = iconMap[iconName]

  return (
    <section className={`py-20 ${className}`}>
      <div className="container">
        <div className="from-card via-card to-muted/20 border-ring/20 relative w-full overflow-hidden rounded-xl border bg-gradient-to-br p-8">
          {/* Background decoration */}
          <div className="from-primary/5 to-primary/5 absolute inset-0 bg-gradient-to-r via-transparent" />
          <div className="bg-primary/10 absolute -top-8 -right-8 h-32 w-32 rounded-full blur-3xl" />
          <div className="bg-primary/5 absolute -bottom-8 -left-8 h-24 w-24 rounded-full blur-2xl" />

          <div className="relative text-center">
            {/* Header */}
            <div className="mb-8">
              <div className="from-primary to-primary/80 shadow-primary/25 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg">
                <IconComponent className="text-primary-foreground h-7 w-7" />
              </div>
              <h2 className="mb-4 text-3xl font-bold lg:text-4xl">{title || t('title')}</h2>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed">
                {description || t('description')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link href={primaryButtonHref}>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-primary/25 shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  {primaryButtonText || t('button1')}
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={secondaryButtonHref}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-ring/30 text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  {secondaryButtonText || t('button2')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
