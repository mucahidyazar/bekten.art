import {
  AdminEmptyState,
  AdminMetric,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  formatAdminDate,
} from '@/components/admin/admin-ui'

import {getAdminService, safeAdminLocale} from '../_lib/admin-data'

const feedbackTone = (status: string) =>
  status === 'RESOLVED'
    ? ('success' as const)
    : status === 'SPAM'
      ? ('danger' as const)
      : ('warning' as const)

export default async function AdminContactPage({
  params,
}: Readonly<{params: Promise<{locale: string}>}>) {
  const {locale: requestedLocale} = await params
  const locale = safeAdminLocale(requestedLocale)
  const summary = await getAdminService(locale).getContactSummary()

  return (
    <>
      <AdminPageHeader
        description="Published contact coordinates and incoming feedback state by locale."
        eyebrow="Communication"
        title="Contact & feedback"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric
          description="All stored messages"
          label="Feedback"
          value={summary.feedback.total}
        />
        <AdminMetric
          description="Not yet reviewed"
          label="New"
          value={summary.feedback.new}
        />
        <AdminMetric
          description="Currently being handled"
          label="In review"
          value={summary.feedback.inReview}
        />
        <AdminMetric
          description="Closed conversations"
          label="Resolved"
          value={summary.feedback.resolved}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel
          description="Contact details currently stored for each locale."
          title="Published contact information"
        >
          {summary.contactLocales.length ? (
            <ul className="divide-y divide-stone-200 dark:divide-stone-800">
              {summary.contactLocales.map(contact => (
                <li className="px-5 py-5" key={contact.locale}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-serif text-lg font-semibold uppercase">
                      {contact.locale}
                    </h2>
                    {contact.isPrimary ? (
                      <AdminStatus label="Primary" tone="success" />
                    ) : null}
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-stone-500">Email</dt>
                      <dd className="mt-1 font-medium break-all">
                        {contact.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-stone-500">Phone</dt>
                      <dd className="mt-1 font-medium">{contact.phone}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-stone-500">Address</dt>
                      <dd className="mt-1 font-medium">{contact.address}</dd>
                    </div>
                    {contact.workingHours ? (
                      <div>
                        <dt className="text-xs text-stone-500">
                          Working hours
                        </dt>
                        <dd className="mt-1 font-medium">
                          {contact.workingHours}
                        </dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-xs text-stone-500">Last updated</dt>
                      <dd className="mt-1 font-medium">
                        {formatAdminDate(contact.updatedAt, locale)}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmptyState
              description="Create a ContactInfo record before publishing contact details."
              title="No contact information configured"
            />
          )}
        </AdminPanel>
        <AdminPanel
          description="The ten most recently received feedback records."
          title="Recent feedback"
        >
          {summary.recentFeedback.length ? (
            <ul className="divide-y divide-stone-200 dark:divide-stone-800">
              {summary.recentFeedback.map(feedback => (
                <li className="px-5 py-5" key={feedback.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-medium">{feedback.subject}</h2>
                      <p className="mt-1 text-xs text-stone-500">
                        {feedback.name} · {feedback.email}
                      </p>
                    </div>
                    <AdminStatus
                      label={feedback.status}
                      tone={feedbackTone(feedback.status)}
                    />
                  </div>
                  <time
                    className="mt-3 block text-xs text-stone-500"
                    dateTime={feedback.createdAt.toISOString()}
                  >
                    {formatAdminDate(feedback.createdAt, locale)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmptyState
              description="New contact submissions will appear here."
              title="No feedback received"
            />
          )}
        </AdminPanel>
      </div>
    </>
  )
}
