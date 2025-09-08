import {Metadata} from 'next'

import {
  ClockIcon,
  LinkIcon,
  MailIcon,
  MapPinIcon,
  PaletteIcon,
  PhoneIcon,
} from 'lucide-react'
import {getTranslations} from 'next-intl/server'

import {CallToAction} from '@/components/molecules/call-to-action'
import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Separator} from '@/components/ui/separator'
import {prepareMetadata} from '@/utils/prepare-metadata'
import {getBektenContactInfo} from '@/utils/supabase/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact')

  return await prepareMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    page: 'contact',
  })
}

export default async function ContactPage() {
  const t = await getTranslations('contact')

  // Get Bekten's public contact information
  const contactData = await getBektenContactInfo()

  if (!contactData) {
    return (
      <div className="w-full pt-8">
        <div className="container space-y-6 text-center">
          <h1 className="text-4xl font-bold lg:text-6xl">
            {t('contactUnavailable')}
          </h1>
          <p className="text-muted-foreground text-xl">
            {t('contactUnavailableDescription')}
          </p>
        </div>
      </div>
    )
  }

  // Get social media links
  const userSocials = contactData.socials || []

  // Prepare contact info
  const contactInfo = {
    phone: contactData.phone || '',
    email: 'bekten.usubaliev@gmail.com', // Public email
    address: contactData.address || '',
    working_hours: contactData.working_hours || '',
    map_embed_url: contactData.map_embed_url || '',
  }

  // Parse working hours JSON
  let workingHours: Record<string, string> = {
    'Monday - Friday': t('defaultWorkingHours.Monday - Friday'),
    Saturday: t('defaultWorkingHours.Saturday'),
    Sunday: t('defaultWorkingHours.Sunday'),
  }

  if (contactInfo.working_hours) {
    workingHours = JSON.parse(contactInfo.working_hours)
  }

  // Parse address lines
  const addressLines = contactInfo.address.split('\n')

  return (
    <div className="container">
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
              {userSocials.map((social: any) => {
                const displayText = social.url.includes('http')
                  ? social.url.replace(/^https?:\/\//, '').replace(/^www\./, '')
                  : social.url

                return (
                  <div key={social.id}>
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
              <div className="relative">
                <iframe
                  src={contactInfo.map_embed_url}
                  width="100%"
                  height="400"
                  style={{border: 0}}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-b-2xl"
                />
                <div className="border-border/50 absolute top-10 left-2 rounded-sm border bg-white px-4 py-1 backdrop-blur-sm">
                  <p className="text-xs font-medium text-blue-700">
                    {t('studioName')}
                  </p>
                  <p className="text-[0.6rem] text-blue-700">
                    {t('studioLocation')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
