import Link from 'next/link'

type EditorialListEntry = Readonly<{
  id: string
  locale: 'en' | 'ky' | 'ru' | 'tr'
  slug: string
  status: 'ARCHIVED' | 'DRAFT' | 'PUBLISHED'
  title: string
  updatedAt: Date
  version: number
}>

type StudioRouteSegment =
  'artworks' | 'collections' | 'exhibitions' | 'journal' | 'pages' | 'press'

type EditorialEntryListProps = Readonly<{
  currentLocale?: 'en' | 'ky' | 'ru' | 'tr'
  currentStatus?: 'ARCHIVED' | 'DRAFT' | 'PUBLISHED'
  entries: readonly EditorialListEntry[]
  label: string
  reorderAction?: (formData: FormData) => Promise<void>
  routeSegment: StudioRouteSegment
}>

const singularLabels = Object.freeze({
  artworks: 'artwork',
  collections: 'collection',
  exhibitions: 'exhibition',
  journal: 'journal entry',
  pages: 'page',
  press: 'press entry',
}) satisfies Readonly<Record<string, string>>

const statusLabels = Object.freeze({
  ARCHIVED: 'Archived',
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
})

export function EditorialEntryList({
  currentLocale = 'en',
  currentStatus,
  entries,
  label,
  reorderAction,
  routeSegment,
}: EditorialEntryListProps) {
  const singularLabel = singularLabels[routeSegment] ?? 'entry'

  return (
    <section aria-labelledby="editorial-list-title">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-red-900 uppercase">
            Editorial archive
          </p>
          <h1
            className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl"
            id="editorial-list-title"
          >
            {label}
          </h1>
        </div>
        <Link
          className="inline-flex min-h-11 items-center bg-stone-950 px-5 py-3 font-semibold text-white"
          href={`/dashboard/${routeSegment}/new`}
        >
          Create {singularLabel}
        </Link>
      </div>

      <form className="mt-8 flex flex-wrap gap-4 border-y border-stone-400/60 py-5">
        <label>
          <span className="mr-2 text-sm font-semibold">Locale</span>
          <select
            className="min-h-11 border border-stone-500 bg-[#fffaf0] px-3"
            defaultValue={currentLocale}
            name="locale"
          >
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
            <option value="ru">Русский</option>
            <option value="ky">Кыргызча</option>
          </select>
        </label>
        <label>
          <span className="mr-2 text-sm font-semibold">Status</span>
          <select
            className="min-h-11 border border-stone-500 bg-[#fffaf0] px-3"
            defaultValue={currentStatus ?? ''}
            name="status"
          >
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <button
          className="min-h-11 border border-stone-700 px-4 py-2 font-semibold"
          type="submit"
        >
          Apply filters
        </button>
      </form>

      {entries.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-500/60 bg-white/30 p-8">
          <h2 className="font-serif text-2xl">No {label.toLowerCase()} yet.</h2>
          <p className="mt-2 leading-7 text-stone-700">
            Create the first {singularLabel} as a private draft.
          </p>
        </div>
      ) : (
        <ol className="mt-8 divide-y divide-stone-400/60 border-y border-stone-400/60">
          {entries.map(entry => (
            <li
              className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
              key={entry.id}
            >
              <div>
                <Link
                  className="font-serif text-2xl underline decoration-stone-400 underline-offset-4 hover:decoration-red-900"
                  href={`/dashboard/${routeSegment}/${entry.id}`}
                >
                  {entry.title}
                </Link>
                <p className="mt-2 text-sm text-stone-600">
                  {entry.locale.toUpperCase()} · {entry.slug} · Updated{' '}
                  {entry.updatedAt.toISOString().slice(0, 10)}
                </p>
              </div>
              <div className="flex gap-3 text-sm font-semibold">
                <span>{statusLabels[entry.status]}</span>
                <span>Version {entry.version}</span>
              </div>
              {reorderAction ? (
                <form
                  action={reorderAction}
                  className="flex gap-2 sm:col-span-2"
                >
                  <input name="entry-id" type="hidden" value={entry.id} />
                  <button
                    className="min-h-11 px-3 text-sm underline disabled:opacity-30"
                    disabled={entries[0]?.id === entry.id}
                    name="direction"
                    type="submit"
                    value="earlier"
                  >
                    Move earlier
                  </button>
                  <button
                    className="min-h-11 px-3 text-sm underline disabled:opacity-30"
                    disabled={entries.at(-1)?.id === entry.id}
                    name="direction"
                    type="submit"
                    value="later"
                  >
                    Move later
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export type {EditorialListEntry}
