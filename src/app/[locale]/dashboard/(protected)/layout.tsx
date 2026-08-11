import {redirect} from 'next/navigation'

import {StudioShell} from '@/components/studio/studio-shell'
import {requireStudioEditor} from '@/server/studio-auth/configured-access'
import {isStudioOwnerRole} from '@/server/studio-auth/roles'

import type {ReactNode} from 'react'

export const dynamic = 'force-dynamic'

export default async function StudioProtectedLayout({
  children,
}: Readonly<{children: ReactNode}>) {
  let user: Awaited<ReturnType<typeof requireStudioEditor>>

  try {
    user = await requireStudioEditor()
  } catch (error) {
    if (
      error instanceof Error &&
      'statusCode' in error &&
      (error.statusCode === 401 || error.statusCode === 403)
    ) {
      redirect('/dashboard/sign-in')
    }

    throw error
  }

  return (
    <StudioShell owner={isStudioOwnerRole(user.role)}>{children}</StudioShell>
  )
}
