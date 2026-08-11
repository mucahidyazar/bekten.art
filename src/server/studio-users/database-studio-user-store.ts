import {createStudioInvitation} from './studio-invitation'

import type {
  StudioInviteInput,
  StudioManagedUser,
  StudioResendInput,
  StudioRoleInput,
  StudioStatusInput,
  StudioUserStore,
} from './studio-user-service'

type StudioUserRow = Readonly<{
  email: string | null
  id: string
  role: string
  sessionVersion: number
  studioStatus: string
}>

type StudioUserTransaction = Readonly<{
  auditEvent: Readonly<{create: (input: unknown) => Promise<unknown>}>
  outboxJob: Readonly<{create: (input: unknown) => Promise<unknown>}>
  session: Readonly<{deleteMany: (input: unknown) => Promise<unknown>}>
  user: Readonly<{
    count: (input: unknown) => Promise<number>
    create: (input: unknown) => Promise<unknown>
    findUnique: (input: unknown) => Promise<StudioUserRow | null>
    update: (input: unknown) => Promise<unknown>
    updateMany: (input: unknown) => Promise<Readonly<{count: number}>>
  }>
  verificationToken: Readonly<{
    create: (input: unknown) => Promise<unknown>
    deleteMany: (input: unknown) => Promise<unknown>
  }>
}>

type StudioUserDatabase = Readonly<{
  $transaction: <Result>(
    callback: (transaction: StudioUserTransaction) => Promise<Result>,
    options?: Readonly<{isolationLevel: 'Serializable'}>,
  ) => Promise<Result>
  user: Readonly<{
    findMany: (input: unknown) => Promise<readonly StudioManagedUser[]>
  }>
}>

type StoreConfiguration = Readonly<{
  appUrl: string
  now?: () => Date
  secret: string
}>

const userSelect = {
  acceptedAt: true,
  created_at: true,
  email: true,
  id: true,
  invitedAt: true,
  last_sign_in_at: true,
  name: true,
  role: true,
  sessionVersion: true,
  studioStatus: true,
  suspendedAt: true,
} as const

function isOwnerRole(role: string) {
  return role === 'OWNER' || role === 'ADMIN'
}

function invitationFor(
  configuration: StoreConfiguration,
  email: string,
) {
  return createStudioInvitation({
    appUrl: configuration.appUrl,
    email,
    now: configuration.now?.(),
    secret: configuration.secret,
  })
}

async function queueInvitation(
  transaction: StudioUserTransaction,
  email: string,
  configuration: StoreConfiguration,
) {
  const invitation = invitationFor(configuration, email)

  await transaction.verificationToken.deleteMany({where: {identifier: email}})
  await transaction.verificationToken.create({data: invitation.verification})
  await transaction.outboxJob.create({data: invitation.outbox})
}

async function protectLastOwner(
  transaction: StudioUserTransaction,
  target: StudioUserRow,
) {
  if (target.studioStatus !== 'ACTIVE' || !isOwnerRole(target.role)) return

  const owners = await transaction.user.count({
    where: {
      role: {in: ['OWNER', 'ADMIN']},
      studioStatus: 'ACTIVE',
    },
  })

  if (owners <= 1) throw new Error('STUDIO_LAST_OWNER_REQUIRED')
}

async function requireTarget(
  transaction: StudioUserTransaction,
  id: string,
) {
  const target = await transaction.user.findUnique({
    select: {
      email: true,
      id: true,
      role: true,
      sessionVersion: true,
      studioStatus: true,
    },
    where: {id},
  })

  if (!target || !target.email) throw new Error('STUDIO_USER_NOT_FOUND')

  return target
}

async function updateWithVersion(
  transaction: StudioUserTransaction,
  input: Readonly<{data: unknown; id: string; version: number}>,
) {
  const result = await transaction.user.updateMany({
    data: input.data,
    where: {id: input.id, sessionVersion: input.version},
  })

  if (result.count !== 1) throw new Error('STUDIO_USER_CONFLICT')
}

export type {StudioUserDatabase, StudioUserTransaction}

export function createDatabaseStudioUserStore(
  database: StudioUserDatabase,
  configuration: StoreConfiguration,
): StudioUserStore {
  const now = configuration.now ?? (() => new Date())

  return Object.freeze({
    async changeRole(input: StudioRoleInput) {
      return database.$transaction(async transaction => {
        const target = await requireTarget(transaction, input.id)

        if (isOwnerRole(target.role) && input.role === 'EDITOR') {
          await protectLastOwner(transaction, target)
        }

        await updateWithVersion(transaction, {
          data: {role: input.role, sessionVersion: {increment: 1}},
          id: input.id,
          version: input.version,
        })
        await transaction.session.deleteMany({where: {userId: input.id}})
        await transaction.auditEvent.create({
          data: {
            action: 'studio.user.role-changed',
            actorUserId: input.actorId,
            entityId: input.id,
            entityType: 'User',
            metadata: {from: target.role, to: input.role},
          },
        })

        return {id: input.id}
      }, {isolationLevel: 'Serializable'})
    },
    async changeStatus(input: StudioStatusInput) {
      return database.$transaction(async transaction => {
        const target = await requireTarget(transaction, input.id)

        if (input.status === 'SUSPENDED') {
          await protectLastOwner(transaction, target)
        }

        await updateWithVersion(transaction, {
          data: {
            sessionVersion: {increment: 1},
            studioStatus: input.status,
            suspendedAt: input.status === 'SUSPENDED' ? now() : null,
          },
          id: input.id,
          version: input.version,
        })
        await transaction.session.deleteMany({where: {userId: input.id}})
        await transaction.auditEvent.create({
          data: {
            action: `studio.user.${input.status === 'ACTIVE' ? 'reactivated' : 'suspended'}`,
            actorUserId: input.actorId,
            entityId: input.id,
            entityType: 'User',
            metadata: {from: target.studioStatus, to: input.status},
          },
        })

        return {id: input.id}
      }, {isolationLevel: 'Serializable'})
    },
    async invite(input: StudioInviteInput) {
      return database.$transaction(async transaction => {
        const existing = await transaction.user.findUnique({
          select: {
            email: true,
            id: true,
            role: true,
            sessionVersion: true,
            studioStatus: true,
          },
          where: {email: input.email},
        })

        if (
          existing &&
          existing.studioStatus === 'ACTIVE' &&
          (existing.role === 'EDITOR' || isOwnerRole(existing.role))
        ) {
          throw new Error('STUDIO_USER_ALREADY_ACTIVE')
        }

        const invitedAt = now()
        const user = existing
          ? await transaction.user.update({
              data: {
                acceptedAt: null,
                invitedAt,
                invitedByUserId: input.actorId,
                name: input.name,
                role: input.role,
                sessionVersion: {increment: 1},
                studioStatus: 'INVITED',
                suspendedAt: null,
              },
              select: {id: true},
              where: {id: existing.id},
            })
          : await transaction.user.create({
              data: {
                email: input.email,
                invitedAt,
                invitedByUserId: input.actorId,
                name: input.name,
                role: input.role,
                studioStatus: 'INVITED',
              },
              select: {id: true},
            })

        await queueInvitation(transaction, input.email, configuration)
        await transaction.auditEvent.create({
          data: {
            action: 'studio.user.invited',
            actorUserId: input.actorId,
            entityId: (user as {id: string}).id,
            entityType: 'User',
            metadata: {role: input.role},
          },
        })

        return user
      }, {isolationLevel: 'Serializable'})
    },
    list: () =>
      database.user.findMany({
        orderBy: [{studioStatus: 'asc'}, {created_at: 'asc'}],
        select: userSelect,
        where: {role: {in: ['EDITOR', 'OWNER', 'ADMIN']}},
      }),
    async resendInvite(input: StudioResendInput) {
      return database.$transaction(async transaction => {
        const target = await requireTarget(transaction, input.id)

        if (target.studioStatus !== 'INVITED') {
          throw new Error('STUDIO_USER_NOT_INVITED')
        }

        await queueInvitation(transaction, target.email!, configuration)
        await transaction.auditEvent.create({
          data: {
            action: 'studio.user.invite-resent',
            actorUserId: input.actorId,
            entityId: input.id,
            entityType: 'User',
            metadata: {},
          },
        })

        return {id: input.id}
      }, {isolationLevel: 'Serializable'})
    },
  })
}
