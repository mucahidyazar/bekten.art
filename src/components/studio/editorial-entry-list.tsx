import Link from 'next/link'

import {ArrowDown, ArrowUp, Plus} from 'lucide-react'

import {NAV_FORWARD_TRANSITION} from '@/components/public-site/public-view-transition'
import {
  StudioEmptyState,
  StudioPageHeader,
} from '@/components/studio/studio-dashboard-components'
import {Badge} from '@/components/ui/badge'
import {Button, buttonVariants} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {cn} from '@/utils'

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
      <StudioPageHeader
        action={
          <Link
            className={cn(
              buttonVariants({size: 'lg'}),
              'gap-2 bg-[#6f2a1a] text-[#fffaf0] hover:bg-[#542014]',
            )}
            href={`/dashboard/${routeSegment}/new`}
            transitionTypes={[...NAV_FORWARD_TRANSITION]}
          >
            <Plus aria-hidden="true" className="size-4" />
            Create {singularLabel}
          </Link>
        }
        description={`Review, filter, reorder, and publish ${label.toLowerCase()} across all four languages.`}
        eyebrow="Editorial archive"
        title={label}
        titleId="editorial-list-title"
      />

      <Card className="mt-8 border-stone-500/35 bg-[#f7f1e6] shadow-none">
        <CardContent className="p-4 sm:p-5">
          <form className="flex flex-wrap items-end gap-4">
            <label className="grid min-w-44 gap-2 text-sm font-semibold">
              Locale
              <select
                className="min-h-11 rounded-md border border-stone-500/40 bg-[#fffaf0] px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[#6f2a1a]/35"
                defaultValue={currentLocale}
                name="locale"
              >
                <option value="en">English</option>
                <option value="tr">Türkçe</option>
                <option value="ru">Русский</option>
                <option value="ky">Кыргызча</option>
              </select>
            </label>
            <label className="grid min-w-44 gap-2 text-sm font-semibold">
              Status
              <select
                className="min-h-11 rounded-md border border-stone-500/40 bg-[#fffaf0] px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[#6f2a1a]/35"
                defaultValue={currentStatus ?? ''}
                name="status"
              >
                <option value="">All</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <Button
              className="border-stone-500/45 bg-[#f7f1e6]"
              size="lg"
              type="submit"
              variant="outline"
            >
              Apply filters
            </Button>
          </form>
        </CardContent>
      </Card>

      {entries.length === 0 ? (
        <div className="mt-8">
          <StudioEmptyState
            description={`Create the first ${singularLabel} as a private draft.`}
            title={`No ${label.toLowerCase()} yet.`}
          />
        </div>
      ) : (
        <ol className="mt-8 grid gap-3">
          {entries.map(entry => (
            <li key={entry.id}>
              <Card className="border-stone-500/30 bg-[#f7f1e6] shadow-none transition-colors hover:border-[#6f2a1a]/50">
                <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <Link
                      className="font-serif text-2xl underline decoration-stone-400 underline-offset-4 hover:decoration-[#6f2a1a]"
                      href={`/dashboard/${routeSegment}/${entry.id}`}
                      transitionTypes={[...NAV_FORWARD_TRANSITION]}
                    >
                      {entry.title}
                    </Link>
                    <p className="mt-2 truncate text-sm text-stone-600">
                      {entry.locale.toUpperCase()} · {entry.slug} · Updated{' '}
                      {entry.updatedAt.toISOString().slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn(
                        entry.status === 'PUBLISHED' &&
                          'border-emerald-700/30 bg-emerald-50 text-emerald-900',
                        entry.status === 'DRAFT' &&
                          'border-[#9a7b42]/45 bg-[#e7dcc6] text-stone-800',
                        entry.status === 'ARCHIVED' &&
                          'border-stone-500/35 bg-stone-200 text-stone-700',
                      )}
                      variant="outline"
                    >
                      {statusLabels[entry.status]}
                    </Badge>
                    <Badge variant="muted">Version {entry.version}</Badge>
                  </div>
                  {reorderAction ? (
                    <form
                      action={reorderAction}
                      className="flex flex-wrap gap-2 sm:col-span-2"
                    >
                      <input name="entry-id" type="hidden" value={entry.id} />
                      <Button
                        className="gap-2"
                        disabled={entries[0]?.id === entry.id}
                        name="direction"
                        size="sm"
                        type="submit"
                        value="earlier"
                        variant="ghost"
                      >
                        <ArrowUp aria-hidden="true" className="size-4" />
                        Move earlier
                      </Button>
                      <Button
                        className="gap-2"
                        disabled={entries.at(-1)?.id === entry.id}
                        name="direction"
                        size="sm"
                        type="submit"
                        value="later"
                        variant="ghost"
                      >
                        <ArrowDown aria-hidden="true" className="size-4" />
                        Move later
                      </Button>
                    </form>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export type {EditorialListEntry}
