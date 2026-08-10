import {notFound, redirect} from 'next/navigation'

import {
  AdminAccessRequiredError,
  AuthenticationRequiredError,
  requireAdminUser,
} from '@/server/auth/access'

type PageProps = Readonly<{
  params: Promise<{locale: string}>
}>

export default async function CreateStorePage({params}: PageProps) {
  const {locale} = await params

  try {
    await requireAdminUser()
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      redirect(`/${locale}/sign-in`)
    }

    if (error instanceof AdminAccessRequiredError) {
      notFound()
    }

    throw error
  }

  redirect(`/${locale}/admin/content`)
}
