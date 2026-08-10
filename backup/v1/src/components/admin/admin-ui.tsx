import Link from 'next/link'

import {ArrowLeft, ArrowRight, Database, Inbox} from 'lucide-react'

import {cn} from '@/utils/cn'

export function AdminEmptyState({
  description,
  title,
}: Readonly<{description: string; title: string}>) {
  return (
    <div className="px-6 py-12 text-center" role="status">
      <Inbox aria-hidden="true" className="mx-auto size-7 text-stone-400" />
      <p className="mt-3 font-medium text-stone-900 dark:text-stone-100">
        {title}
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm text-stone-500 dark:text-stone-400">
        {description}
      </p>
    </div>
  )
}

export function AdminMetric({
  description,
  label,
  value,
}: Readonly<{description: string; label: string; value: number | string}>) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_12px_36px_-28px_rgba(28,25,23,0.55)] dark:border-stone-800 dark:bg-stone-950">
      <Database
        aria-hidden="true"
        className="absolute top-5 right-5 size-4 text-red-700/60 dark:text-red-400/70"
      />
      <p className="pr-8 text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase dark:text-stone-400">
        {label}
      </p>
      <p className="mt-5 font-serif text-4xl font-semibold text-stone-950 tabular-nums dark:text-stone-50">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-stone-400">
        {description}
      </p>
    </section>
  )
}

export function AdminPageHeader({
  description,
  eyebrow,
  title,
}: Readonly<{description: string; eyebrow?: string; title: string}>) {
  return (
    <header className="space-y-2 border-b border-stone-200 pb-6 dark:border-stone-800">
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.2em] text-red-700 uppercase dark:text-red-400">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl dark:text-stone-50">
        {title}
      </h1>
      <p className="max-w-3xl text-sm leading-6 text-stone-600 dark:text-stone-300">
        {description}
      </p>
    </header>
  )
}

export function AdminPagination({
  basePath,
  page,
  pageSize,
  searchParams,
  total,
}: Readonly<{
  basePath: string
  page: number
  pageSize: number
  searchParams: PaginationSearchParams
  total: number
}>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)
  const linkClass =
    'inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 transition hover:border-red-700 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:border-stone-700 dark:text-stone-100 dark:hover:border-red-400 dark:hover:text-red-300'

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-5 py-4 dark:border-stone-800"
    >
      <p
        aria-live="polite"
        className="text-sm text-stone-500 tabular-nums dark:text-stone-400"
      >
        {first}–{last} of {total}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            aria-label="Previous page"
            className={linkClass}
            href={paginationHref(basePath, page - 1, searchParams)}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            aria-label="Next page"
            className={linkClass}
            href={paginationHref(basePath, page + 1, searchParams)}
          >
            Next
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </div>
    </nav>
  )
}

export function AdminPanel({
  children,
  description,
  title,
}: Readonly<{
  children: React.ReactNode
  description?: string
  title: string
}>) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
      <div className="border-b border-stone-200 px-5 py-4 dark:border-stone-800">
        <h2 className="font-serif text-xl font-semibold text-stone-950 dark:text-stone-50">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function AdminStatus({
  label,
  tone = 'neutral',
}: Readonly<{
  label: string
  tone?: keyof typeof statusStyles
}>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        statusStyles[tone],
      )}
    >
      {label}
    </span>
  )
}

const statusStyles: Record<
  'danger' | 'neutral' | 'success' | 'warning',
  string
> = {
  danger:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  neutral:
    'border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100',
}

export function formatAdminBytes(bytes: number) {
  if (bytes < 1_024) return `${bytes} B`

  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1_024
  let index = 0

  while (value >= 1_024 && index < units.length - 1) {
    value /= 1_024
    index += 1
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`
}

type PaginationSearchParams = Readonly<Record<string, string | undefined>>

function paginationHref(
  basePath: string,
  page: number,
  searchParams: PaginationSearchParams,
) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (value) params.set(key, value)
  }
  params.set('page', String(page))

  return `${basePath}?${params.toString()}`
}

export function formatAdminDate(value: Date | null, locale: string) {
  if (!value) return 'Never'

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}
