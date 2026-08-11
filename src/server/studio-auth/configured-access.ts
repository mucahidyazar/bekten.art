import {auth} from '@/auth'
import {prisma} from '@/lib/db'

import {createStudioAccess} from './roles'

const configuredStudioAccess = createStudioAccess({
  async findUserById(userId: string) {
    return prisma.user.findUnique({
      select: {id: true, role: true},
      where: {id: userId},
    })
  },
  getSession: auth,
})

export const requireStudioEditor = configuredStudioAccess.requireEditor
export const requireStudioOwner = configuredStudioAccess.requireOwner
