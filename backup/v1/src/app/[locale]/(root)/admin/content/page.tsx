import {
  AdminMetric,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
} from '@/components/admin/admin-ui'

import {getAdminService, safeAdminLocale} from '../_lib/admin-data'

export default async function AdminContentPage({
  params,
}: Readonly<{params: Promise<{locale: string}>}>) {
  const {locale: requestedLocale} = await params
  const locale = safeAdminLocale(requestedLocale)
  const {collections} = await getAdminService(locale).getContentSummary()
  const totals = collections.reduce(
    (result, item) => ({
      archived: result.archived + item.archived,
      draft: result.draft + item.draft,
      published: result.published + item.published,
      total: result.total + item.total,
    }),
    {archived: 0, draft: 0, published: 0, total: 0},
  )

  return (
    <>
      <AdminPageHeader
        description="Publication state across every typed editorial collection. Counts come directly from PostgreSQL."
        eyebrow="Editorial"
        title="Content"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric
          description="All typed content records"
          label="Total"
          value={totals.total}
        />
        <AdminMetric
          description="Visible on public pages"
          label="Published"
          value={totals.published}
        />
        <AdminMetric
          description="Not yet public"
          label="Draft"
          value={totals.draft}
        />
        <AdminMetric
          description="Retained outside publication"
          label="Archived"
          value={totals.archived}
        />
      </div>
      <AdminPanel
        description="Lifecycle breakdown by content model."
        title="Collections"
      >
        <ul className="divide-y divide-stone-200 dark:divide-stone-800">
          {collections.map(collection => (
            <li
              className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(12rem,1fr)_auto] sm:items-center"
              key={collection.key}
            >
              <div>
                <h2 className="font-medium text-stone-900 dark:text-stone-100">
                  {collection.label}
                </h2>
                <p className="mt-1 text-xs text-stone-500">
                  {collection.total} total record
                  {collection.total === 1 ? '' : 's'}
                </p>
              </div>
              <div
                className="flex flex-wrap gap-2"
                aria-label={`${collection.label} publication states`}
              >
                <AdminStatus
                  label={`${collection.published} published`}
                  tone="success"
                />
                <AdminStatus
                  label={`${collection.draft} draft`}
                  tone={collection.draft ? 'warning' : 'neutral'}
                />
                <AdminStatus label={`${collection.archived} archived`} />
              </div>
            </li>
          ))}
        </ul>
      </AdminPanel>
    </>
  )
}
