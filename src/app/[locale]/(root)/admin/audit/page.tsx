import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  formatAdminDate,
} from '@/components/admin/admin-ui'

import {getAdminService, safeAdminLocale} from '../_lib/admin-data'

type SearchParams = Promise<{
  entityType?: string | string[]
  page?: string | string[]
  query?: string | string[]
}>
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export default async function AdminAuditPage({
  params,
  searchParams,
}: Readonly<{params: Promise<{locale: string}>; searchParams: SearchParams}>) {
  const [{locale: requestedLocale}, rawSearch] = await Promise.all([
    params,
    searchParams,
  ])
  const locale = safeAdminLocale(requestedLocale)
  const entityType = first(rawSearch.entityType) || ''
  const query = first(rawSearch.query) || ''
  const events = await getAdminService(locale).listAuditEvents({
    entityType,
    page: rawSearch.page,
    query,
  })

  return (
    <>
      <AdminPageHeader
        description="A chronological, immutable-facing view of recorded administrative and system operations. Filter by action text or exact entity type."
        eyebrow="Accountability"
        title="Audit log"
      />
      <AdminPanel
        description={`${events.total} event${events.total === 1 ? '' : 's'} match the current filters.`}
        title="Recorded events"
      >
        <form
          className="grid gap-3 border-b border-stone-200 p-5 sm:grid-cols-[1fr_1fr_auto] dark:border-stone-800"
          method="get"
          role="search"
        >
          <div>
            <label
              className="mb-1.5 block text-xs font-medium"
              htmlFor="audit-query"
            >
              Action contains
            </label>
            <input
              className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:border-stone-700 dark:bg-stone-900"
              defaultValue={query}
              id="audit-query"
              name="query"
              type="search"
            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-xs font-medium"
              htmlFor="entity-type"
            >
              Entity type
            </label>
            <input
              className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:border-stone-700 dark:bg-stone-900"
              defaultValue={entityType}
              id="entity-type"
              name="entityType"
            />
          </div>
          <button
            className="min-h-11 self-end rounded-xl bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:bg-red-800"
            type="submit"
          >
            Apply filters
          </button>
        </form>
        {events.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[62rem] text-left text-sm">
              <thead className="bg-stone-50 text-xs tracking-wide text-stone-500 uppercase dark:bg-stone-900">
                <tr>
                  <th className="px-5 py-3" scope="col">
                    Time
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Action
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Entity
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Actor
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Request
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {events.items.map(event => (
                  <tr key={event.id}>
                    <td className="px-5 py-4 text-stone-500">
                      <time dateTime={event.createdAt.toISOString()}>
                        {formatAdminDate(event.createdAt, locale)}
                      </time>
                    </td>
                    <th className="px-5 py-4 font-medium" scope="row">
                      {event.action}
                    </th>
                    <td className="px-5 py-4">
                      <span className="block">{event.entityType}</span>
                      <span
                        className="mt-1 block max-w-48 truncate text-xs text-stone-500"
                        title={event.entityId || undefined}
                      >
                        {event.entityId || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-stone-600 dark:text-stone-300">
                      {event.actor?.name ||
                        event.actor?.email ||
                        event.actorUserId ||
                        'System'}
                    </td>
                    <td className="px-5 py-4">
                      <code className="text-xs text-stone-500">
                        {event.requestId || '—'}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            description="Change the filters or perform an audited operation."
            title="No audit events found"
          />
        )}
        <AdminPagination
          basePath={`/${locale}/admin/audit`}
          page={events.page}
          pageSize={events.pageSize}
          searchParams={{entityType, query}}
          total={events.total}
        />
      </AdminPanel>
    </>
  )
}
