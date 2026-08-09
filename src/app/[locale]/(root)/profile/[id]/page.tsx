import {notFound, redirect} from 'next/navigation'

import {
  CalendarIcon,
  ClockIcon,
  GlobeIcon,
  MapPinIcon,
} from 'lucide-react'

import {ArtistHero} from '@/components/molecules/artist-hero'
import {SignOutButton} from '@/components/molecules/sign-out-button'
import {Badge} from '@/components/ui/badge'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {prisma} from '@/lib/db'
import {
  AuthenticationRequiredError,
  ResourceAccessDeniedError,
  requireOwnerOrAdminUser,
} from '@/server/auth/access'

type PageProps = Readonly<{
  params: Promise<{id: string; locale: string}>
}>

function formatDate(date: Date | null, locale: string) {
  if (!date) return null

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date)
}

function profileLocation(address: string | null) {
  return address?.trim() || null
}

export default async function ProfilePage({params}: PageProps) {
  const {id, locale} = await params

  try {
    await requireOwnerOrAdminUser(id)
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      redirect(`/${locale}/sign-in`)
    }

    if (error instanceof ResourceAccessDeniedError) {
      notFound()
    }

    throw error
  }

  const profile = await prisma.user.findUnique({
    select: {
      address: true,
      bio: true,
      created_at: true,
      email: true,
      emailVerified: true,
      id: true,
      image: true,
      last_sign_in_at: true,
      name: true,
      role: true,
      updated_at: true,
      website: true,
    },
    where: {id},
  })

  if (!profile) {
    notFound()
  }

  const memberSince = formatDate(profile.created_at, locale)
  const lastActive = formatDate(profile.last_sign_in_at, locale)
  const location = profileLocation(profile.address)

  return (
    <div className="app-container space-y-8 py-8">
      <ArtistHero
        name={profile.name || 'Bekten Art member'}
        title={profile.email || profile.role}
        quote={profile.bio || undefined}
        imageUrl={profile.image || '/me.jpg'}
        badges={[
          {
            icon: profile.role === 'ADMIN' ? 'shield' : 'user',
            label: profile.role.toLowerCase(),
            variant: 'default',
          },
          ...(profile.emailVerified
            ? [
                {
                  icon: 'badge' as const,
                  label: 'Verified email',
                  variant: 'secondary' as const,
                },
              ]
            : []),
        ]}
      />

      <div className="flex justify-center">
        <SignOutButton />
      </div>

      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground flex items-center gap-2 text-sm">
                <CalendarIcon aria-hidden="true" className="h-4 w-4" />
                Member since
              </dt>
              <dd className="mt-2 font-medium">{memberSince}</dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground flex items-center gap-2 text-sm">
                <ClockIcon aria-hidden="true" className="h-4 w-4" />
                Last active
              </dt>
              <dd className="mt-2 font-medium">{lastActive || 'Not recorded'}</dd>
            </div>

            {location && (
              <div className="rounded-xl border p-4">
                <dt className="text-muted-foreground flex items-center gap-2 text-sm">
                  <MapPinIcon aria-hidden="true" className="h-4 w-4" />
                  Location
                </dt>
                <dd className="mt-2 font-medium">{location}</dd>
              </div>
            )}

            {profile.website && (
              <div className="rounded-xl border p-4">
                <dt className="text-muted-foreground flex items-center gap-2 text-sm">
                  <GlobeIcon aria-hidden="true" className="h-4 w-4" />
                  Website
                </dt>
                <dd className="mt-2">
                  <a
                    href={profile.website}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="text-primary font-medium underline-offset-4 hover:underline"
                  >
                    {profile.website}
                  </a>
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="outline">Role: {profile.role}</Badge>
            <Badge variant="outline">
              Updated {formatDate(profile.updated_at, locale)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
