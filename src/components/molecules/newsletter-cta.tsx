'use client'

import { MailIcon, ArrowRightIcon, CheckIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface NewsletterCTAProps {
  title?: string
  description?: string
  className?: string
}

export function NewsletterCTA({
  title,
  description,
  className = ""
}: NewsletterCTAProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const t = useTranslations('cta.newsletter')
  const tForms = useTranslations('forms')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    // TODO: Implement newsletter subscription
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
      setEmail('')
      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000)
    }, 1000)
  }

  if (isSuccess) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-4">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <CheckIcon className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">{tForms('messages.subscribeSuccess')}</h3>
            <p className="text-sm text-green-600 dark:text-green-300">{tForms('messages.subscribeDescription')}</p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-200/30 dark:bg-green-700/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-emerald-200/30 dark:bg-emerald-700/20 rounded-full blur-xl" />
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/20 border border-ring/20 rounded-xl p-6 ${className}`}>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
            <MailIcon className="w-7 h-7 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{title || t('title')}</h3>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
            {description || t('description')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Input
                type="email"
                placeholder={t('placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 pl-4 pr-4 bg-background/80 backdrop-blur-sm border-ring/30 focus:border-primary/50 focus:bg-background shadow-sm"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !email}
              className="h-12 px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  {tForms('buttons.subscribing')}
                </>
              ) : (
                <>
                  {tForms('buttons.subscribe')}
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-green-500 rounded-full" />
              <span>{tForms('messages.noSpam')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full" />
              <span>{tForms('messages.unsubscribeAnytime')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-purple-500 rounded-full" />
              <span>{tForms('messages.weeklyUpdates')}</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
