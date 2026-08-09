import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminStatus,
  formatAdminDate,
} from '@/components/admin/admin-ui'

import {getAdminService, safeAdminLocale} from '../_lib/admin-data'

type SearchParams = Promise<{
  page?: string | string[]
  query?: string | string[]
}>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminUsersPage({
  params,
  searchParams,
}: Readonly<{params: Promise<{locale: string}>; searchParams: SearchParams}>) {
  const [{locale: requestedLocale}, rawSearch] = await Promise.all([
    params,
    searchParams,
  ])
  const locale = safeAdminLocale(requestedLocale)
  const query = first(rawSearch.query) || ''
  const users = await getAdminService(locale).listUsers({
    page: rawSearch.page,
    query,
  })

  return (
    <>
      <AdminPageHeader
        description="Search registered accounts, authentication providers and verification state. Password data is never exposed here."
        eyebrow="Identity"
        title="Users"
      />
      <AdminPanel
        description={`${users.total} account${users.total === 1 ? '' : 's'} match the current filter.`}
        title="Account directory"
      >
        <form
          className="flex flex-col gap-3 border-b border-stone-200 p-5 sm:flex-row dark:border-stone-800"
          method="get"
          role="search"
        >
          <label className="sr-only" htmlFor="user-query">
            Search users
          </label>
          <input
            className="min-h-11 flex-1 rounded-xl border border-stone-300 bg-white px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:border-stone-700 dark:bg-stone-900"
            defaultValue={query}
            id="user-query"
            name="query"
            placeholder="Search by name or email"
            type="search"
          />
          <button
            className="min-h-11 rounded-xl bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:bg-red-800 dark:hover:bg-red-700"
            type="submit"
          >
            Search
          </button>
        </form>
        {users.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem] text-left text-sm">
              <thead className="bg-stone-50 text-xs tracking-wide text-stone-500 uppercase dark:bg-stone-900 dark:text-stone-400">
                <tr>
                  <th className="px-5 py-3" scope="col">
                    Account
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Role
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Verification
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Providers
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Last sign-in
                  </th>
                  <th className="px-5 py-3" scope="col">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {users.items.map(user => (
                  <tr key={user.id}>
                    <th className="px-5 py-4" scope="row">
                      <span className="block font-medium text-stone-900 dark:text-stone-100">
                        {user.name || 'Unnamed account'}
                      </span>
                      <span className="mt-1 block text-xs font-normal text-stone-500">
                        {user.email || 'No email address'}
                      </span>
                    </th>
                    <td className="px-5 py-4">
                      <AdminStatus
                        label={user.role}
                        tone={user.role === 'ADMIN' ? 'danger' : 'neutral'}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <AdminStatus
                        label={user.emailVerified ? 'Verified' : 'Unverified'}
                        tone={user.emailVerified ? 'success' : 'warning'}
                      />
                    </td>
                    <td className="px-5 py-4 text-stone-600 dark:text-stone-300">
                      {user.providers.length
                        ? user.providers.join(', ')
                        : 'Credentials'}
                    </td>
                    <td className="px-5 py-4 text-stone-500">
                      {formatAdminDate(user.lastSignInAt, locale)}
                    </td>
                    <td className="px-5 py-4 text-stone-500">
                      {formatAdminDate(user.createdAt, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            description="Try a different name or email address."
            title="No matching accounts"
          />
        )}
        <AdminPagination
          basePath={`/${locale}/admin/users`}
          page={users.page}
          pageSize={users.pageSize}
          searchParams={{query}}
          total={users.total}
        />
      </AdminPanel>
    </>
  )
}
