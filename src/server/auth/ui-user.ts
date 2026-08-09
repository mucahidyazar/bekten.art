import {getAuthenticatedUser} from './access'

import type {UiUser} from '@/types/ui-user'

export async function getUiUser(): Promise<UiUser | null> {
  const user = await getAuthenticatedUser()

  if (!user) {
    return null
  }

  return Object.freeze({
    email: user.email,
    id: user.id,
    image: user.image,
    isAdmin: user.role === 'ADMIN',
    name: user.name,
    role: user.role as UiUser['role'],
  })
}
