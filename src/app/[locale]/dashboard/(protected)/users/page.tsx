import {redirect} from 'next/navigation'

import {StudioUserManager} from '@/components/studio/studio-user-manager'
import {requireStudioOwner} from '@/server/studio-auth/configured-access'
import {getConfiguredStudioUsers} from '@/server/studio-users/configured-studio-users'

export const dynamic = 'force-dynamic'

export default async function StudioUsersPage() {
  try {
    await requireStudioOwner()
  } catch (error) {
    if (
      error instanceof Error &&
      'statusCode' in error &&
      (error.statusCode === 401 || error.statusCode === 403)
    ) {
      redirect('/dashboard')
    }

    throw error
  }

  const users = await getConfiguredStudioUsers().list()

  return (
    <StudioUserManager
      initialUsers={users.flatMap(user =>
        user.email
          ? [
              {
                acceptedAt: user.acceptedAt?.toISOString() ?? null,
                createdAt: user.created_at.toISOString(),
                email: user.email,
                id: user.id,
                invitedAt: user.invitedAt?.toISOString() ?? null,
                lastSignInAt: user.last_sign_in_at?.toISOString() ?? null,
                name: user.name,
                role: user.role,
                status: user.studioStatus,
                suspendedAt: user.suspendedAt?.toISOString() ?? null,
                version: user.sessionVersion,
              },
            ]
          : [],
      )}
    />
  )
}
