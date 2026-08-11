import {isStudioEditorRole} from './roles'

import type {StudioVerificationToken} from './magic-link-coordinator'
import type {Adapter} from 'next-auth/adapters'

type StudioVerificationCoordinator = Readonly<{
  storeVerificationToken: (
    token: StudioVerificationToken,
  ) => Promise<StudioVerificationToken>
}>

export function createStudioAdapter(
  adapter: Adapter,
  coordinator: StudioVerificationCoordinator,
): Adapter {
  const getSessionAndUser = adapter.getSessionAndUser
  const deleteSession = adapter.deleteSession

  if (!getSessionAndUser || !deleteSession) {
    throw new Error('Studio authentication requires database session support')
  }

  return {
    ...adapter,
    createVerificationToken(token) {
      return coordinator.storeVerificationToken(token)
    },
    async getSessionAndUser(sessionToken) {
      const current = await getSessionAndUser(sessionToken)
      const role = (current?.user as {role?: unknown} | undefined)?.role

      if (!current || isStudioEditorRole(role)) {
        return current
      }

      await deleteSession(sessionToken)

      return null
    },
  }
}
