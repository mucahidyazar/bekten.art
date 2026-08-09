import {
  AdminEmptyState,
  AdminMetric,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  formatAdminBytes,
  formatAdminDate,
} from '@/components/admin/admin-ui'

import {getAdminService, safeAdminLocale} from '../_lib/admin-data'

const mediaTone = (status: string) =>
  status === 'READY'
    ? ('success' as const)
    : status === 'FAILED' || status === 'QUARANTINED'
      ? ('danger' as const)
      : ('warning' as const)

export default async function AdminMediaPage({
  params,
}: Readonly<{params: Promise<{locale: string}>}>) {
  const {locale: requestedLocale} = await params
  const locale = safeAdminLocale(requestedLocale)
  const summary = await getAdminService(locale).getMediaSummary()

  return (
    <>
      <AdminPageHeader
        description="Garage-backed objects and Instagram synchronisation state. Storage capacity is not guessed; only persisted object bytes are reported."
        eyebrow="Asset pipeline"
        title="Media"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric
          description="All tracked media objects"
          label="Objects"
          value={summary.media.total}
        />
        <AdminMetric
          description="Verified and available"
          label="Ready"
          value={summary.media.ready}
        />
        <AdminMetric
          description="Failed or quarantined"
          label="Needs attention"
          value={summary.media.failed}
        />
        <AdminMetric
          description="Sum of persisted object sizes"
          label="Tracked size"
          value={formatAdminBytes(summary.media.bytes)}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <AdminPanel
          description="The ten latest objects registered in the media library."
          title="Recent media"
        >
          {summary.recentMedia.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="bg-stone-50 text-xs tracking-wide text-stone-500 uppercase dark:bg-stone-900">
                  <tr>
                    <th className="px-5 py-3" scope="col">
                      File
                    </th>
                    <th className="px-5 py-3" scope="col">
                      Status
                    </th>
                    <th className="px-5 py-3" scope="col">
                      Access
                    </th>
                    <th className="px-5 py-3" scope="col">
                      Size
                    </th>
                    <th className="px-5 py-3" scope="col">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {summary.recentMedia.map(media => (
                    <tr key={media.id}>
                      <th className="px-5 py-4" scope="row">
                        <span
                          className="block max-w-64 truncate font-medium"
                          title={media.filename}
                        >
                          {media.filename}
                        </span>
                        <span className="mt-1 block text-xs font-normal text-stone-500">
                          {media.mimeType} · {media.provider}
                        </span>
                      </th>
                      <td className="px-5 py-4">
                        <AdminStatus
                          label={media.status}
                          tone={mediaTone(media.status)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <AdminStatus label={media.visibility} />
                      </td>
                      <td className="px-5 py-4 text-stone-600 tabular-nums dark:text-stone-300">
                        {formatAdminBytes(media.sizeBytes)}
                      </td>
                      <td className="px-5 py-4 text-stone-500">
                        {formatAdminDate(media.createdAt, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AdminEmptyState
              description="Uploaded and synchronised objects will appear here."
              title="No media registered"
            />
          )}
        </AdminPanel>
        <AdminPanel
          description="Persisted Instagram post records."
          title="Instagram sync"
        >
          <dl className="divide-y divide-stone-200 dark:divide-stone-800">
            <div className="flex justify-between px-5 py-4">
              <dt>Total posts</dt>
              <dd className="font-semibold tabular-nums">
                {summary.instagram.total}
              </dd>
            </div>
            <div className="flex justify-between px-5 py-4">
              <dt>Active posts</dt>
              <dd className="font-semibold tabular-nums">
                {summary.instagram.active}
              </dd>
            </div>
            <div className="px-5 py-4">
              <dt className="text-sm text-stone-500">Last persisted sync</dt>
              <dd className="mt-2 text-sm font-medium">
                {formatAdminDate(summary.instagram.lastSyncedAt, locale)}
              </dd>
            </div>
          </dl>
        </AdminPanel>
      </div>
    </>
  )
}
