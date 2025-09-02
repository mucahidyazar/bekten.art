import {
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  UserIcon,
  ClockIcon,
  PaletteIcon,
} from 'lucide-react'
import {getTranslations} from 'next-intl/server'

import {getContactInfo} from '@/actions/contact'
import {CallToAction} from '@/components/molecules/CallToAction'
import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Separator} from '@/components/ui/separator'
import {prepareMetadata} from '@/utils/prepareMetadata'

export async function generateMetadata(): Promise<
  ReturnType<typeof prepareMetadata>
> {
  const title = '🎨 Get in Touch - Connect with Bekten Usubaliev'
  const description =
    '🎨 Reach out to Bekten Usubaliev, share your thoughts, or inquire about his mesmerizing artwork. Join the journey of exploring the depths of human emotions through art.'

  return await prepareMetadata({
    title,
    description,
    page: 'contact',
  })
}

export default async function ContactPage() {
  const t = await getTranslations()
  const contactInfo = await getContactInfo()

  if (!contactInfo) {
    return (
      <div className="w-full pt-8">
        <div className="container space-y-6 text-center">
          <h1 className="text-4xl font-bold lg:text-6xl">
            Contact Information
          </h1>
          <p className="text-muted-foreground text-xl">
            Contact information is currently unavailable. Please try again
            later.
          </p>
        </div>
      </div>
    )
  }

  // Parse working hours JSON
  let workingHours: Record<string, string> = {
    'Monday - Friday': '9:00 AM - 6:00 PM',
    Saturday: '10:00 AM - 4:00 PM',
    Sunday: 'By Appointment',
  }

  try {
    if (contactInfo.working_hours) {
      workingHours = JSON.parse(contactInfo.working_hours)
    }
  } catch (e) {
    // Use default working hours if JSON parsing fails
  }

  // Parse address lines
  const addressLines = contactInfo.address.split('\n')

  // Extract Instagram username from URL
  const instagramUsername =
    contactInfo.instagram_url.split('/').pop() || 'bekten_usubaliev'

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
            Get in Touch
          </Badge>
          <h1 className="text-4xl font-bold lg:text-6xl">
            Let's Create Something
            <span className="text-primary block">Beautiful Together</span>
          </h1>
          <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
            Whether you're interested in commissioning a piece, discussing art,
            or simply want to connect, I'd love to hear from you and explore the
            possibilities.
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
                <span>Studio Information</span>
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
                    {addressLines.map((line, index) => (
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
                      Phone
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
                      Email
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

              {/* Instagram */}
              <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 rounded-xl bg-gradient-to-r p-4 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                    <UserIcon className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground mb-1 font-semibold">
                      Instagram
                    </h3>
                    <a
                      href={contactInfo.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      @{instagramUsername}
                    </a>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Studio Hours */}
              <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 rounded-xl bg-gradient-to-r p-4 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                    <ClockIcon className="text-primary h-5 w-5" />
                  </div>
                  <div className="w-full">
                    <h3 className="text-foreground mb-2 font-semibold">
                      Studio Hours
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
                <span>Find My Studio</span>
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
                    Bekten's Art Studio
                  </p>
                  <p className="text-[0.6rem] text-blue-700">
                    Bishkek, Kyrgyzstan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CallToAction
        title="Ready to Start a Conversation?"
        description="Don't hesitate to reach out. Every great artwork begins with a simple conversation."
        primaryButtonText="Send Email"
        primaryButtonHref={`mailto:${contactInfo.email}`}
        secondaryButtonText="Call Now"
        secondaryButtonHref={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
        iconName="mail"
        className="py-0"
      />
    </div>
  )
}
