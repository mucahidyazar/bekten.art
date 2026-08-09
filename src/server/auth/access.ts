import type {Session} from 'next-auth'

type AuthenticatedUser = Readonly<{
  id: string
  role: string
}>

type AuthAccessDependencies<User extends AuthenticatedUser> = Readonly<{
  findUserById: (userId: string) => Promise<User | null>
  getSession: () => Promise<Session | null>
  now?: () => Date
  recentAuthenticationMaxAgeMs?: number
}>

export class AdminAccessRequiredError extends Error {
  readonly statusCode = 403

  constructor() {
    super('Admin access required')
    this.name = 'AdminAccessRequiredError'
  }
}

export class AuthenticationRequiredError extends Error {
  readonly statusCode = 401

  constructor() {
    super('Authentication required')
    this.name = 'AuthenticationRequiredError'
  }
}

export class RecentAuthenticationRequiredError extends Error {
  readonly statusCode = 403

  constructor() {
    super('Recent authentication required')
    this.name = 'RecentAuthenticationRequiredError'
  }
}

export class ResourceAccessDeniedError extends Error {
  readonly statusCode = 403

  constructor() {
    super('Resource access denied')
    this.name = 'ResourceAccessDeniedError'
  }
}

export function createAuthAccess<User extends AuthenticatedUser>(
  dependencies: AuthAccessDependencies<User>,
) {
  async function getAuthenticatedUser() {
    const session = await dependencies.getSession()
    const userId = session?.user?.id

    return userId ? dependencies.findUserById(userId) : null
  }

  async function requireAuthenticatedUser() {
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new AuthenticationRequiredError()
    }

    return user
  }

  async function requireAdminUser() {
    const user = await requireAuthenticatedUser()

    if (user.role !== 'ADMIN') {
      throw new AdminAccessRequiredError()
    }

    return user
  }

  async function requireRecentAdminUser() {
    const session = await dependencies.getSession()
    const userId = session?.user?.id

    if (!userId) {
      throw new AuthenticationRequiredError()
    }

    const user = await dependencies.findUserById(userId)

    if (!user) {
      throw new AuthenticationRequiredError()
    }

    if (user.role !== 'ADMIN') {
      throw new AdminAccessRequiredError()
    }

    const authenticatedAt = session.user.authenticatedAt
    const maximumAge = dependencies.recentAuthenticationMaxAgeMs ?? 30 * 60 * 1_000
    const age =
      typeof authenticatedAt === 'number'
      ? (dependencies.now?.() ?? new Date()).valueOf() - authenticatedAt * 1_000
      : Number.POSITIVE_INFINITY

    if (age < 0 || age > maximumAge) {
      throw new RecentAuthenticationRequiredError()
    }

    return user
  }

  async function requireOwnerOrAdminUser(ownerId: string) {
    const user = await requireAuthenticatedUser()

    if (user.id !== ownerId && user.role !== 'ADMIN') {
      throw new ResourceAccessDeniedError()
    }

    return user
  }

  return Object.freeze({
    getAuthenticatedUser,
    requireAdminUser,
    requireAuthenticatedUser,
    requireOwnerOrAdminUser,
    requireRecentAdminUser,
  })
}

const configuredAccess = createAuthAccess({
  async findUserById(userId: string) {
    const {prisma} = await import('../../lib/db')

    return prisma.user.findUnique({where: {id: userId}})
  },
  async getSession() {
    const [{getServerSession}, {authOptions}] = await Promise.all([
      import('next-auth'),
      import('../../auth'),
    ])

    return getServerSession(authOptions)
  },
})

export const getAuthenticatedUser = configuredAccess.getAuthenticatedUser
export const requireAdminUser = configuredAccess.requireAdminUser
export const requireAuthenticatedUser = configuredAccess.requireAuthenticatedUser
export const requireOwnerOrAdminUser = configuredAccess.requireOwnerOrAdminUser
export const requireRecentAdminUser = configuredAccess.requireRecentAdminUser
