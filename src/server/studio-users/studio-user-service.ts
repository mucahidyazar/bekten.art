import {z} from 'zod'

import {normalizeStudioEmail} from '@/server/studio-auth/magic-link-coordinator'

const idSchema = z.string().uuid()
const versionSchema = z.number().int().min(0).max(2_147_483_647)
const studioRoleSchema = z.enum(['EDITOR', 'OWNER'])
const studioStatusSchema = z.enum(['ACTIVE', 'SUSPENDED'])

const inviteCommandSchema = z
  .object({
    action: z.literal('user.invite'),
    email: z.string().transform(normalizeStudioEmail),
    name: z.string().trim().min(2).max(120).optional(),
    role: studioRoleSchema,
  })
  .strict()
const roleCommandSchema = z
  .object({
    action: z.literal('user.role'),
    id: idSchema,
    role: studioRoleSchema,
    version: versionSchema,
  })
  .strict()
const statusCommandSchema = z
  .object({
    action: z.literal('user.status'),
    id: idSchema,
    status: studioStatusSchema,
    version: versionSchema,
  })
  .strict()
const resendCommandSchema = z
  .object({action: z.literal('user.resend-invite'), id: idSchema})
  .strict()

const studioUserCommandSchema = z.discriminatedUnion('action', [
  inviteCommandSchema,
  resendCommandSchema,
  roleCommandSchema,
  statusCommandSchema,
])

type StudioUserCommand = z.input<typeof studioUserCommandSchema>
type StudioManagedUser = Readonly<{
  acceptedAt: Date | null
  created_at: Date
  email: string | null
  id: string
  invitedAt: Date | null
  last_sign_in_at: Date | null
  name: string | null
  role: 'ADMIN' | 'EDITOR' | 'OWNER'
  sessionVersion: number
  studioStatus: 'ACTIVE' | 'INVITED' | 'SUSPENDED'
  suspendedAt: Date | null
}>
type StudioInviteInput = Readonly<{
  actorId: string
  email: string
  name?: string
  role: 'EDITOR' | 'OWNER'
}>
type StudioRoleInput = Readonly<{
  actorId: string
  id: string
  role: 'EDITOR' | 'OWNER'
  version: number
}>
type StudioStatusInput = Readonly<{
  actorId: string
  id: string
  status: 'ACTIVE' | 'SUSPENDED'
  version: number
}>
type StudioResendInput = Readonly<{actorId: string; id: string}>
type StudioUserStore = Readonly<{
  changeRole: (input: StudioRoleInput) => Promise<unknown>
  changeStatus: (input: StudioStatusInput) => Promise<unknown>
  invite: (input: StudioInviteInput) => Promise<unknown>
  list: () => Promise<readonly StudioManagedUser[]>
  resendInvite: (input: StudioResendInput) => Promise<unknown>
}>

export type {
  StudioInviteInput,
  StudioManagedUser,
  StudioResendInput,
  StudioRoleInput,
  StudioStatusInput,
  StudioUserCommand,
  StudioUserStore,
}

export function createStudioUserService(store: StudioUserStore) {
  return Object.freeze({
    async command(actorId: string, candidate: StudioUserCommand) {
      let command: z.output<typeof studioUserCommandSchema>

      try {
        command = studioUserCommandSchema.parse(candidate)
      } catch {
        throw new Error('STUDIO_USER_COMMAND_INVALID')
      }

      if (command.action === 'user.invite') {
        return store.invite({
          actorId,
          email: command.email,
          ...(command.name ? {name: command.name} : {}),
          role: command.role,
        })
      }

      if (command.action === 'user.role') {
        return store.changeRole({
          actorId,
          id: command.id,
          role: command.role,
          version: command.version,
        })
      }

      if (command.action === 'user.status') {
        return store.changeStatus({
          actorId,
          id: command.id,
          status: command.status,
          version: command.version,
        })
      }

      return store.resendInvite({actorId, id: command.id})
    },
    list: store.list,
  })
}
export {studioUserCommandSchema}
