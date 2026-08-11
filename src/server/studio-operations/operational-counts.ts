import {prisma} from '@/lib/db'

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000

export async function getStudioOperationalCounts(now = new Date()) {
  const auditWindowStart = new Date(now.getTime() - DAY_IN_MILLISECONDS)
  const [pendingDeliveries, failedDeliveries, problemMedia, recentAuditEvents] =
    await Promise.all([
      prisma.outboxJob.count({where: {status: 'PENDING'}}),
      prisma.outboxJob.count({where: {status: 'FAILED'}}),
      prisma.mediaObject.count({
        where: {status: {in: ['FAILED', 'QUARANTINED']}},
      }),
      prisma.auditEvent.count({where: {createdAt: {gte: auditWindowStart}}}),
    ])

  return Object.freeze({
    failedDeliveries,
    pendingDeliveries,
    problemMedia,
    recentAuditEvents,
  })
}
