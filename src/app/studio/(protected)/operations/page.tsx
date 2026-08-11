import {redirect} from 'next/navigation'

import {requireStudioOwner} from '@/server/studio-auth/configured-access'
import {getStudioOperationalCounts} from '@/server/studio-operations/operational-counts'

const operationalCards = [
  {key: 'pendingDeliveries', label: 'Pending deliveries'},
  {key: 'failedDeliveries', label: 'Failed deliveries'},
  {key: 'quarantinedMedia', label: 'Quarantined media'},
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
      redirect('/studio')
    }

    throw error
  }

  const counts = await getStudioOperationalCounts()

  return (
    <section aria-labelledby="studio-operations-title">
      <p className="text-xs font-semibold tracking-[0.2em] text-red-900 uppercase">
        Owner access
      </p>
      <h1
        className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl"
        id="studio-operations-title"
      >
        Operations
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
        Delivery, media safety, and audit signals for maintaining the private
        editorial system.
      </p>
      <dl className="mt-10 grid gap-4 sm:grid-cols-2">
        {operationalCards.map(card => (
          <div
            className="border border-stone-400/60 bg-[#f8f2e6] p-6"
            key={card.key}
          >
            <dt className="text-sm leading-6 text-stone-600">{card.label}</dt>
            <dd className="mt-3 font-serif text-4xl">{counts[card.key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
