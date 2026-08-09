import {notFound, redirect} from 'next/navigation'

import {ProfileForm} from '@/components/organisms/profile-form'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {prisma} from '@/lib/db'
import {
  AuthenticationRequiredError,
  ResourceAccessDeniedError,
  requireOwnerOrAdminUser,
} from '@/server/auth/access'

import {updateProfileAction} from './actions'

import type {AppLocale} from '@/lib/localized-path'

type PageProps = {
  params: Promise<{id: string; locale: string}>
}

export default async function ProfileEditPage({params}: PageProps) {
  const {id, locale} = await params
  const safeLocale = locale as AppLocale

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
      github: true,
      id: true,
      instagram: true,
      linkedin: true,
      name: true,
      phone: true,
      twitter: true,
      website: true,
    },
    where: {id},
  })

  if (!profile) {
    notFound()
  }

  const action = updateProfileAction.bind(null, id, locale)

  return (
    <section className="app-container py-8">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>{profileTitles[safeLocale]}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            action={action}
            locale={safeLocale}
            profile={profile}
          />
        </CardContent>
      </Card>
    </section>
  )
}

const profileTitles: Readonly<Record<AppLocale, string>> = {
  en: 'Edit profile',
  ky: 'Профилди түзөтүү',
  ru: 'Редактировать профиль',
  tr: 'Profili düzenle',
}
