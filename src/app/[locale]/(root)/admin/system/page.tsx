import {
  AdminMetric,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  formatAdminDate,
} from '@/components/admin/admin-ui'

import {getAdminService, safeAdminLocale} from '../_lib/admin-data'

export default async function AdminSystemPage({
  params,
}: Readonly<{params: Promise<{locale: string}>}>) {
  const {locale: requestedLocale} = await params
  const locale = safeAdminLocale(requestedLocale)
  const system = await getAdminService(locale).getSystemSummary()
  const configuredCount = system.configuration.filter(
    item => item.configured,
  ).length

  return (
    <>
      <AdminPageHeader
        description="Runtime configuration readiness and persisted operational queues. Secret values are never displayed."
        eyebrow="Production readiness"
        title="System"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric
          description="Events recorded during the last day"
          label="24h audit events"
          value={system.auditEventsLast24Hours}
        />
        <AdminMetric
          description="Active rate-limit identities"
          label="Rate-limit buckets"
          value={system.rateLimitBuckets}
        />
        <AdminMetric
          description="Checks with required environment variables"
          label="Configured services"
          value={`${configuredCount}/${system.configuration.length}`}
        />
        <AdminMetric
          description="Most recent audit event"
          label="Last activity"
          value={
            system.latestAuditAt
              ? formatAdminDate(system.latestAuditAt, locale)
              : 'Never'
          }
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel
          description="Presence checks only; credentials remain server-side."
          title="Service configuration"
        >
          <ul className="divide-y divide-stone-200 dark:divide-stone-800">
            {system.configuration.map(item => (
              <li
                className="flex items-start justify-between gap-4 px-5 py-5"
                key={item.key}
              >
                <div>
                  <h2 className="font-medium">{item.label}</h2>
                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    {item.description}
                  </p>
                </div>
                <AdminStatus
                  label={item.configured ? 'Configured' : 'Missing'}
                  tone={item.configured ? 'success' : 'danger'}
                />
              </li>
            ))}
          </ul>
        </AdminPanel>
        <div className="space-y-6">
          <AdminPanel
            description="Persisted outbox state across all job types."
            title="Background jobs"
          >
            <dl className="grid grid-cols-2 gap-px bg-stone-200 dark:bg-stone-800">
              {[
                ['Pending', system.jobs.pending],
                ['Processing', system.jobs.processing],
                ['Completed', system.jobs.completed],
                ['Failed', system.jobs.failed],
              ].map(([label, value]) => (
                <div className="bg-white p-5 dark:bg-stone-950" key={label}>
                  <dt className="text-xs text-stone-500">{label}</dt>
                  <dd className="mt-2 font-serif text-3xl font-semibold tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </AdminPanel>
          <AdminPanel
            description="Media object processing state."
            title="Storage pipeline"
          >
            <dl className="divide-y divide-stone-200 dark:divide-stone-800">
              <div className="flex justify-between px-5 py-4">
                <dt>Ready</dt>
                <dd>
                  <AdminStatus
                    label={String(system.storage.ready)}
                    tone="success"
                  />
                </dd>
              </div>
              <div className="flex justify-between px-5 py-4">
                <dt>Uploading</dt>
                <dd>
                  <AdminStatus
                    label={String(system.storage.uploading)}
                    tone={system.storage.uploading ? 'warning' : 'neutral'}
                  />
                </dd>
              </div>
              <div className="flex justify-between px-5 py-4">
                <dt>Failed or quarantined</dt>
                <dd>
                  <AdminStatus
                    label={String(system.storage.failed)}
                    tone={system.storage.failed ? 'danger' : 'success'}
                  />
                </dd>
              </div>
            </dl>
          </AdminPanel>
        </div>
      </div>
    </>
  )
}
