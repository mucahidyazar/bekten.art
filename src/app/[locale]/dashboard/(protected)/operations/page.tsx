import {redirect} from 'next/navigation'

import {
  StudioMetricCard,
  StudioPageHeader,
} from '@/components/studio/studio-dashboard-components'
import {requireStudioOwner} from '@/server/studio-auth/configured-access'
import {getStudioOperationalCounts} from '@/server/studio-operations/operational-counts'

const operationalCards = [
  {key: 'pendingDeliveries', label: 'Pending deliveries'},
  {key: 'failedDeliveries', label: 'Failed deliveries'},
  {key: 'problemMedia', label: 'Failed or quarantined media'},
  {key: 'recentAuditEvents', label: 'Audit events, last 24 hours'},
] as const

export default async function StudioOperationsPage() {
  try {
    await requireStudioOwner()
  } catch (error) {
    if (
      error instanceof Error &&
      'statusCode' in error &&
      (error.statusCode === 401 || error.statusCode === 403)
    ) {
      redirect('/dashboard')
    }

    throw error
  }

  const counts = await getStudioOperationalCounts()

  return (
    <section aria-labelledby="studio-operations-title">
      <StudioPageHeader
        description="Delivery, media safety, and audit signals for maintaining the private editorial system."
        eyebrow="Owner access"
        title="Operations"
        titleId="studio-operations-title"
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {operationalCards.map(card => (
          <StudioMetricCard
            key={card.key}
            label={card.label}
            value={counts[card.key]}
          />
        ))}
      </div>
    </section>
  )
}
