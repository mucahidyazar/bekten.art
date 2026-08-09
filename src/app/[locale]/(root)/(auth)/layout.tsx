import {redirect} from 'next/navigation'

import {getTranslations} from 'next-intl/server'

import {Tabs} from '@/components/molecules/tabs'
import {getAuthenticatedUser} from '@/server/auth/access'

type Props = {
  children: React.ReactNode
  params: Promise<{locale: string}>
}

export default async function AuthLayout({children, params}: Props) {
  const {locale} = await params
  const [user, t] = await Promise.all([
    getAuthenticatedUser(),
    getTranslations({locale, namespace: 'navigation'}),
  ])

  if (user) {
    redirect(`/${locale}/profile/${user.id}`)
  }

  const tabs = [
    {
      value: `/${locale}/sign-in`,
      label: t('signIn'),
    },
    {
      value: `/${locale}/sign-up`,
      label: t('signUp'),
    },
  ]

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-muted mb-4 rounded-lg p-1">
          <Tabs tabs={tabs} />
        </div>

        <div className="bg-card border-muted rounded-lg border p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
