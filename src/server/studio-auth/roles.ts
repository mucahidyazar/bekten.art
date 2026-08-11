type StudioUser = Readonly<{
  id: string
  role: string
}>

type StudioSession = Readonly<{
  user?: Readonly<{id?: string | null}> | null
}> | null

type StudioAccessDependencies<User extends StudioUser> = Readonly<{
  findUserById: (userId: string) => Promise<User | null>
  getSession: () => Promise<StudioSession>
}>

export class StudioAuthenticationRequiredError extends Error {
  readonly statusCode = 401

  constructor() {
    super('Studio authentication required')
    this.name = 'StudioAuthenticationRequiredError'
  }
}

export class StudioEditorRequiredError extends Error {
  readonly statusCode = 403

  constructor() {
    super('Studio editor access required')
    this.name = 'StudioEditorRequiredError'
  }
}

export class StudioOwnerRequiredError extends Error {
  readonly statusCode = 403

  constructor() {
    super('Studio owner access required')
    this.name = 'StudioOwnerRequiredError'
  }
}

export function createStudioAccess<User extends StudioUser>(
  dependencies: StudioAccessDependencies<User>,
) {
  async function currentUser() {
    const session = await dependencies.getSession()
    const userId = session?.user?.id

    if (!userId) {
      throw new StudioAuthenticationRequiredError()
    }

    const user = await dependencies.findUserById(userId)

    if (!user) {
      throw new StudioAuthenticationRequiredError()
    }

    return user
  }

  async function requireEditor() {
    const user = await currentUser()

    if (!isStudioEditorRole(user.role)) {
      throw new StudioEditorRequiredError()
    }

    return user
  }

  async function requireOwner() {
    const user = await currentUser()

    if (!isStudioOwnerRole(user.role)) {
      throw new StudioOwnerRequiredError()
    }

    return user
  }

  return Object.freeze({requireEditor, requireOwner})
}

export function isStudioEditorRole(role: unknown) {
  return role === 'EDITOR' || role === 'OWNER' || role === 'ADMIN'
}

export function isStudioOwnerRole(role: unknown) {
  return role === 'OWNER' || role === 'ADMIN'
}
