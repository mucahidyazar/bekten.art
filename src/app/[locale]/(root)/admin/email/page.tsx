import {
  AdminEmptyState,
  AdminMetric,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  formatAdminDate,
} from '@/components/admin/admin-ui'

import {getAdminService, safeAdminLocale} from '../_lib/admin-data'

const subscriberTone = (status: string) =>
  status === 'ACTIVE'
    ? ('success' as const)
    : status === 'BOUNCED'
      ? ('danger' as const)
      : status === 'PENDING'
        ? ('warning' as const)
        : ('neutral' as const)

export default async function AdminEmailPage({
  params,
}: Readonly<{params: Promise<{locale: string}>}>) {
  const {locale: requestedLocale} = await params
  const locale = safeAdminLocale(requestedLocale)
  const summary = await getAdminService(locale).getEmailSummary()

  return (
    <>
      <AdminPageHeader
        description="Newsletter consent state and transactional email delivery jobs. This view does not trigger bulk mail."
        eyebrow="Resend delivery"
        title="Email"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric
          description="All consent records"
          label="Subscribers"
          value={summary.subscribers.total}
        />
        <AdminMetric
          description="Confirmed recipients"
          label="Active"
          value={summary.subscribers.active}
        />
        <AdminMetric
          description="Awaiting confirmation"
          label="Pending"
          value={summary.subscribers.pending}
        />
        <AdminMetric
          description="Delivery jobs that need review"
          label="Failed deliveries"
          value={summary.delivery.failed}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <AdminPanel
          description="The ten latest newsletter consent records."
          title="Recent subscribers"
        >
          {summary.recentSubscribers.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead className="bg-stone-50 text-xs tracking-wide text-stone-500 uppercase dark:bg-stone-900">
                  <tr>
                    <th className="px-5 py-3" scope="col">
                      Email
                    </th>
                    <th className="px-5 py-3" scope="col">
                      Status
                    </th>
                    <th className="px-5 py-3" scope="col">
                      Locale
                    </th>
                    <th className="px-5 py-3" scope="col">
                      Source
                    </th>
                    <th className="px-5 py-3" scope="col">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {summary.recentSubscribers.map(subscriber => (
                    <tr key={subscriber.id}>
                      <th className="px-5 py-4 font-medium" scope="row">
                        {subscriber.email}
                      </th>
                      <td className="px-5 py-4">
                        <AdminStatus
                          label={subscriber.status}
                          tone={subscriberTone(subscriber.status)}
                        />
                      </td>
                      <td className="px-5 py-4 uppercase">
                        {subscriber.locale}
                      </td>
                      <td className="px-5 py-4 text-stone-600 dark:text-stone-300">
                        {subscriber.source}
                      </td>
                      <td className="px-5 py-4 text-stone-500">
                        {formatAdminDate(subscriber.createdAt, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AdminEmptyState
              description="Newsletter sign-ups will appear after consent is recorded."
              title="No subscribers"
            />
          )}
        </AdminPanel>
        <AdminPanel
          description="Outbox jobs whose type begins with email."
          title="Delivery pipeline"
        >
          <dl className="divide-y divide-stone-200 dark:divide-stone-800">
            <div className="flex justify-between px-5 py-4">
              <dt>Completed</dt>
              <dd>
                <AdminStatus
                  label={String(summary.delivery.completed)}
                  tone="success"
                />
              </dd>
            </div>
            <div className="flex justify-between px-5 py-4">
              <dt>Pending or processing</dt>
              <dd>
                <AdminStatus
                  label={String(summary.delivery.pending)}
                  tone={summary.delivery.pending ? 'warning' : 'neutral'}
                />
              </dd>
            </div>
            <div className="flex justify-between px-5 py-4">
              <dt>Failed</dt>
              <dd>
                <AdminStatus
                  label={String(summary.delivery.failed)}
                  tone={summary.delivery.failed ? 'danger' : 'success'}
                />
              </dd>
            </div>
            <div className="flex justify-between px-5 py-4">
              <dt>Unsubscribed</dt>
              <dd className="font-semibold tabular-nums">
                {summary.subscribers.unsubscribed}
              </dd>
            </div>
            <div className="flex justify-between px-5 py-4">
              <dt>Bounced</dt>
              <dd className="font-semibold tabular-nums">
                {summary.subscribers.bounced}
              </dd>
            </div>
          </dl>
        </AdminPanel>
      </div>
    </>
  )
}
