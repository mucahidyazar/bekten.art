import {redirect} from 'next/navigation'

import {Tabs} from '@/components/molecules/tabs'

type Props = {
  children: React.ReactNode
}

export default async function AuthLayout({children}: Props) {
  // TODO: Check if user is already authenticated with Supabase
  const user = null

  if (user) {
    redirect('/')
  }

  const tabs = [
    {
      value: '/sign-in',
      label: 'Sign In',
    },
    {
      value: '/sign-up',
      label: 'Sign Up',
    },
  ]

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
      <div className="w-full max-w-md">
        {/* Navigation Tabs */}
        <div className="bg-muted p-1 rounded-lg mb-4">
          <Tabs tabs={tabs} />
        </div>

        {/* Content */}
        <div className="bg-card border border-muted rounded-lg p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}