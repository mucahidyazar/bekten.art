import {z} from 'zod'

import type {AppUserRole} from './session-utils'

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(1).max(1_024),
})

// Comparing an unknown identity against a valid, static bcrypt hash keeps the
// observable work close to the known-user path without exposing any secret.
const DUMMY_PASSWORD_HASH =
  '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'

type StoredCredentialUser = Readonly<{
  email: string | null
  emailVerified: Date | null
  id: string
  image: string | null
  name: string | null
  passwordHash: string | null
  passwordResetRequired: boolean
  role: AppUserRole
  sessionVersion: number
}>

type CredentialDependencies = Readonly<{
  comparePassword: (password: string, hash: string) => Promise<boolean>
  findUserByEmail: (email: string) => Promise<StoredCredentialUser | null>
}>

export async function authorizeCredentials(
  input: unknown,
  dependencies: CredentialDependencies,
) {
  const parsed = credentialsSchema.safeParse(input)

  if (!parsed.success) {
    return null
  }

  const user = await dependencies.findUserByEmail(parsed.data.email)
  const passwordMatches = await dependencies.comparePassword(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  )

  if (
    !user?.passwordHash ||
    !passwordMatches ||
    !user.email ||
    !user.emailVerified ||
    user.passwordResetRequired
  ) {
    return null
  }

  return Object.freeze({
    email: user.email,
    id: user.id,
    image: user.image,
    name: user.name,
    passwordResetRequired: user.passwordResetRequired,
    role: user.role,
    sessionVersion: user.sessionVersion,
  })
}
