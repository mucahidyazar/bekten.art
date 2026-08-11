import type {
  StudioActivityEvent,
  StudioActivityQuery,
  StudioActivityRepository,
} from './studio-activity-service'

type ActivityDatabase = Readonly<{
  auditEvent: Readonly<{
    count: (input: unknown) => Promise<number>
    findMany: (input: unknown) => Promise<
      readonly (Omit<StudioActivityEvent, 'actor'> & {
        actorUser: StudioActivityEvent['actor']
      })[]
    >
  }>
}>

export type {ActivityDatabase}

export function createDatabaseStudioActivityRepository(
  database: ActivityDatabase,
): StudioActivityRepository {
  return Object.freeze({
    async list(query: StudioActivityQuery) {
      const where = {
        ...(query.action ? {action: {contains: query.action}} : {}),
        ...(query.actor
          ? {
              actorUser: {
                OR: [
                  {email: {contains: query.actor, mode: 'insensitive'}},
                  {name: {contains: query.actor, mode: 'insensitive'}},
                ],
              },
            }
          : {}),
        ...(query.entity
          ? {
              OR: [
                {entityType: {contains: query.entity, mode: 'insensitive'}},
                {entityId: {contains: query.entity, mode: 'insensitive'}},
              ],
            }
          : {}),
        ...(query.from || query.to
          ? {
              createdAt: {
                ...(query.from ? {gte: new Date(query.from)} : {}),
                ...(query.to ? {lte: new Date(query.to)} : {}),
              },
            }
          : {}),
      }
      const [events, total] = await Promise.all([
        database.auditEvent.findMany({
          orderBy: [{createdAt: 'desc'}, {id: 'desc'}],
          select: {
            action: true,
            actorUser: {select: {email: true, name: true}},
            actorUserId: true,
            createdAt: true,
            entityId: true,
            entityType: true,
            id: true,
            metadata: true,
          },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          where,
        }),
        database.auditEvent.count({where}),
      ])

      return {
        events: events.map(({actorUser, ...event}) => ({
          ...event,
          actor: actorUser,
        })),
        total,
      }
    },
  })
}
