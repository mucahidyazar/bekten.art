import {Metadata} from 'next'

import {
  ClockIcon,
  LinkIcon,
  MailIcon,
  MapPinIcon,
  PaletteIcon,
  PhoneIcon,
} from 'lucide-react'
import {getLocale, getTranslations} from 'next-intl/server'

import {ConsentGoogleMap} from '@/components/consent/google-map'
import {FeedbackForm} from '@/components/forms/feedback-form'
import {CallToAction} from '@/components/molecules/call-to-action'
import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Separator} from '@/components/ui/separator'
import {getPublicContactInfo} from '@/server/contact/public-contact'
import {prepareMetadata} from '@/utils/prepare-metadata'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact')

  return prepareMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    page: 'contact',
  })
}

export default async function ContactPage() {
  const [t, locale] = await Promise.all([
    getTranslations('contact'),
    getLocale(),
  ])

  const contactData = await getPublicContactInfo(
    locale as 'en' | 'tr' | 'ru' | 'ky',
  )

  if (!contactData) {
    return (
      <div className="app-container w-full space-y-10 pt-8">
        <div className="app-container space-y-6 text-center">
          <h1 className="text-4xl font-bold lg:text-6xl">
            {t('contactUnavailable')}
          </h1>
          <p className="text-muted-foreground text-xl">
            {t('contactUnavailableDescription')}
          </p>
        </div>
        <FeedbackForm locale={locale as 'en' | 'tr' | 'ru' | 'ky'} />
      </div>
    )
  }

  // Get social media links
  const userSocials = contactData.socials

  // Prepare contact info
  const contactInfo = {
    address: contactData.address,
    email: contactData.email,
    mapEmbedUrl: contactData.mapEmbedUrl || '',
    phone: contactData.phone,
    workingHours: contactData.workingHours || '',
  }

  // Parse working hours JSON
  let workingHours: Record<string, string> = {
    'Monday - Friday': t('defaultWorkingHours.Monday - Friday'),
    Saturday: t('defaultWorkingHours.Saturday'),
    Sunday: t('defaultWorkingHours.Sunday'),
  }

  if (contactInfo.workingHours) {
    try {
      const parsedWorkingHours: unknown = JSON.parse(contactInfo.workingHours)

      if (
        parsedWorkingHours &&
        typeof parsedWorkingHours === 'object' &&
        Object.values(parsedWorkingHours).every(
          value => typeof value === 'string',
        )
      ) {
        workingHours = parsedWorkingHours as Record<string, string>
      }
    } catch {
      // Keep the localized defaults when stored contact data is malformed.
    }
  }

  // Parse address lines
  const addressLines = contactInfo.address.split('\n')

  return (
    <div className="app-container">
      {/* Hero Section */}
      <div className="space-y-6 text-center">
        <div className="space-y-4">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-primary/20"
          >
            <MailIcon className="mr-2 h-3 w-3" />
            {t('title')}
          </Badge>
          <h1 className="text-4xl font-bold lg:text-6xl">{t('subtitle')}</h1>
          <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Contact Information */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-card overflow-hidden rounded-2xl border shadow-lg">
            <CardHeader className="bg-muted/30 border-border/50 border-b">
              <CardTitle className="flex items-center space-x-3 text-xl font-semibold">
                <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
                  <PaletteIcon className="text-primary h-4 w-4" />
                </div>
                <span>{t('studioInfo')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Address */}
              <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 rounded-xl bg-gradient-to-r p-4 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                    <MapPinIcon className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground mb-1 font-semibold">
                      {t('address')}
                    </h3>
                    {addressLines.map((line: string, index: number) => (
                      <p key={index} className="text-muted-foreground">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 rounded-xl bg-gradient-to-r p-4 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                    <PhoneIcon className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground mb-1 font-semibold">
                      {t('phone')}
                    </h3>
                    <a
                      href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 rounded-xl bg-gradient-to-r p-4 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                    <MailIcon className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground mb-1 font-semibold">
                      {t('email')}
                    </h3>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Social Media Links - Dynamic */}
              {userSocials.map((social, index) => {
                const displayText = social.url.includes('http')
                  ? social.url.replace(/^https?:\/\//, '').replace(/^www\./, '')
                  : social.url

                return (
                  <div
                    key={
                      social.id || `${social.platform}-${index}-${social.url}`
                    }
                  >
                    <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 rounded-xl bg-gradient-to-r p-4 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                          <LinkIcon className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-foreground mb-1 font-semibold capitalize">
                            {social.platform}
                          </h3>
                          <a
                            href={
                              social.url.startsWith('http')
                                ? social.url
                                : `https://${social.url}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            {displayText}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <Separator />

              {/* Studio Hours */}
              <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 rounded-xl bg-gradient-to-r p-4 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                    <ClockIcon className="text-primary h-5 w-5" />
                  </div>
                  <div className="w-full">
                    <h3 className="text-foreground mb-2 font-semibold">
                      {t('studioHours')}
                    </h3>
                    <div className="text-muted-foreground w-full space-y-1 text-sm">
                      {Object.entries(workingHours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <span>{day}</span>
                          <span>{hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-card overflow-hidden rounded-2xl border shadow-lg">
            <CardHeader className="bg-muted/30 border-border/50 border-b">
              <CardTitle className="flex items-center space-x-3 text-xl font-semibold">
                <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
                  <MapPinIcon className="text-primary h-4 w-4" />
                </div>
                <span>{t('findStudio')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ConsentGoogleMap
                src={contactInfo.mapEmbedUrl}
                title={`${t('studioName')} – ${t('studioLocation')} studio map`}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <FeedbackForm locale={locale as 'en' | 'tr' | 'ru' | 'ky'} />

      <CallToAction
        title={t('readyToTalk')}
        description={t('readyDescription')}
        primaryButtonText={t('sendEmail')}
        primaryButtonHref={`mailto:${contactInfo.email}`}
        secondaryButtonText={t('callNow')}
        secondaryButtonHref={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
        iconName="mail"
        className="py-0"
      />
    </div>
  )
}
