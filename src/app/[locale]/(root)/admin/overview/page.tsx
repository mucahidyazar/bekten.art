import Link from 'next/link'

import {
  AdminEmptyState,
  AdminMetric,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  formatAdminDate,
} from '@/components/admin/admin-ui'

import {getAdminService, safeAdminLocale} from '../_lib/admin-data'

export default async function AdminOverviewPage({
  params,
}: Readonly<{params: Promise<{locale: string}>}>) {
  const {locale: requestedLocale} = await params
  const locale = safeAdminLocale(requestedLocale)
  const service = getAdminService(locale)
  const [overview, system] = await Promise.all([
    service.getOverview(),
    service.getSystemSummary(),
  ])

  return (
    <>
      <AdminPageHeader
        description="A live operational view assembled from PostgreSQL, media storage state, subscriber records, feedback and the audit trail."
        eyebrow="Studio control room"
        title="Overview"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminMetric
          description="All registered accounts"
          label="Users"
          value={overview.metrics.users}
        />
        <AdminMetric
          description={`${overview.metrics.publishedContent} of ${overview.metrics.totalContent} records published`}
          label="Published content"
          value={overview.metrics.publishedContent}
        />
        <AdminMetric
          description="Objects available to serve"
          label="Ready media"
          value={overview.metrics.mediaReady}
        />
        <AdminMetric
          description="Confirmed newsletter audience"
          label="Active subscribers"
          value={overview.metrics.activeSubscribers}
        />
        <AdminMetric
          description="New or currently in review"
          label="Open feedback"
          value={overview.metrics.openFeedback}
        />
        <AdminMetric
          description="Recorded in the last 24 hours"
          label="Audit events"
          value={system.auditEventsLast24Hours}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <AdminPanel
          description="Most recent recorded administrative and system operations."
          title="Recent audit trail"
        >
          {overview.recentAudit.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <thead className="bg-stone-50 text-xs tracking-wide text-stone-500 uppercase dark:bg-stone-900 dark:text-stone-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold" scope="col">
                      Action
                    </th>
                    <th className="px-5 py-3 font-semibold" scope="col">
                      Entity
                    </th>
                    <th className="px-5 py-3 font-semibold" scope="col">
                      Actor
                    </th>
                    <th className="px-5 py-3 font-semibold" scope="col">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {overview.recentAudit.map(event => (
                    <tr key={event.id}>
                      <th
                        className="px-5 py-4 font-medium text-stone-900 dark:text-stone-100"
                        scope="row"
                      >
                        {event.action}
                      </th>
                      <td className="px-5 py-4 text-stone-600 dark:text-stone-300">
                        {event.entityType}
                      </td>
                      <td className="px-5 py-4 text-stone-600 dark:text-stone-300">
                        {event.actor?.name || event.actor?.email || 'System'}
                      </td>
                      <td className="px-5 py-4 text-stone-500 dark:text-stone-400">
                        {formatAdminDate(event.createdAt, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AdminEmptyState
              description="Operations will appear here once they have been recorded."
              title="No audit events recorded"
            />
          )}
          <div className="border-t border-stone-200 px-5 py-4 dark:border-stone-800">
            <Link
              className="text-sm font-semibold text-red-700 underline-offset-4 hover:underline dark:text-red-400"
              href={`/${locale}/admin/audit`}
            >
              View full audit log
            </Link>
          </div>
        </AdminPanel>

        <AdminPanel
          description="Work that needs attention, measured from persisted state."
          title="Pipeline"
        >
          <dl className="divide-y divide-stone-200 dark:divide-stone-800">
            {[
              ['Draft content', overview.pipeline.draftContent],
              ['Pending media', overview.pipeline.pendingMedia],
              ['Pending subscribers', overview.pipeline.pendingSubscribers],
              ['Failed jobs', overview.pipeline.failedJobs],
            ].map(([label, value]) => (
              <div
                className="flex items-center justify-between gap-4 px-5 py-4"
                key={label}
              >
                <dt className="text-sm text-stone-600 dark:text-stone-300">
                  {label}
                </dt>
                <dd>
                  <AdminStatus
                    label={String(value)}
                    tone={Number(value) > 0 ? 'warning' : 'success'}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </AdminPanel>
      </div>
    </>
  )
}
