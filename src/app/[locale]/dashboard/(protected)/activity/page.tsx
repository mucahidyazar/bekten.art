import Link from 'next/link'
import {redirect} from 'next/navigation'

import {StudioPageHeader} from '@/components/studio/studio-dashboard-components'
import {Badge} from '@/components/ui/badge'
import {Button, buttonVariants} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {configuredStudioActivity} from '@/server/studio-activity/configured-studio-activity'
import {requireStudioOwner} from '@/server/studio-auth/configured-access'
import {cn} from '@/utils'

import {activityPageNumber} from './activity-page-number'

type ActivityPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>

function single(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : ''
}

function dateBoundary(value: string, end = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return undefined

  const parsed = new Date(`${value}T${end ? '23:59:59.999' : '00:00:00.000'}Z`)

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

function pageHref(filters: Readonly<Record<string, string>>, page: number) {
  const params = new URLSearchParams(
    Object.entries({...filters, page: String(page)}).filter(([, value]) => value),
  )

  return `/dashboard/activity?${params.toString()}`
}

export const dynamic = 'force-dynamic'

export default async function StudioActivityPage({
  searchParams,
}: ActivityPageProps) {
  try {
    await requireStudioOwner()
  } catch (error) {
    if (
      error instanceof Error &&
      'statusCode' in error &&
      (error.statusCode === 401 || error.statusCode === 403)
    ) {
      redirect('/dashboard')
    }

    throw error
  }

  const raw = await searchParams
  const filters = {
    action: single(raw.action).slice(0, 120),
    actor: single(raw.actor).slice(0, 120),
    entity: single(raw.entity).slice(0, 120),
    from: single(raw.from),
    to: single(raw.to),
  }
  const page = activityPageNumber(raw.page)
  const from = dateBoundary(filters.from)
  const to = dateBoundary(filters.to, true)
  const activity = await configuredStudioActivity.list({
    ...(filters.action ? {action: filters.action} : {}),
    ...(filters.actor ? {actor: filters.actor} : {}),
    ...(filters.entity ? {entity: filters.entity} : {}),
    ...(from ? {from} : {}),
    ...(to ? {to} : {}),
    page,
  })
  const pages = Math.max(1, Math.ceil(activity.total / activity.pageSize))

  return (
    <section aria-labelledby="studio-activity-title">
      <StudioPageHeader
        description="A privacy-safe record of publishing, access, media and operational changes."
        eyebrow="Owner access"
        title="Activity"
        titleId="studio-activity-title"
      />

      <form className="mt-8 grid gap-3 rounded-lg border border-stone-500/30 bg-[#f7f1e6] p-4 md:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="activity-actor">User</Label>
          <Input defaultValue={filters.actor} id="activity-actor" name="actor" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="activity-action">Action</Label>
          <Input
            defaultValue={filters.action}
            id="activity-action"
            name="action"
            placeholder="media."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="activity-entity">Target</Label>
          <Input defaultValue={filters.entity} id="activity-entity" name="entity" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="activity-from">From</Label>
          <Input defaultValue={filters.from} id="activity-from" name="from" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="activity-to">To</Label>
          <Input defaultValue={filters.to} id="activity-to" name="to" type="date" />
        </div>
        <div className="flex gap-2 md:col-span-5">
          <Button type="submit">Apply filters</Button>
          <Link className={cn(buttonVariants({variant: 'outline'}))} href="/dashboard/activity">
            Clear
          </Link>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-stone-500/30 bg-[#f7f1e6]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activity.events.map(event => (
              <TableRow key={event.id}>
                <TableCell className="whitespace-nowrap text-xs">
                  {event.createdAt.toLocaleString('en')}
                </TableCell>
                <TableCell>
                  <p className="font-medium">
                    {event.actor?.name || event.actor?.email || 'System'}
                  </p>
                  {event.actor?.name && event.actor.email ? (
                    <p className="text-xs text-stone-500">{event.actor.email}</p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{event.action}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {event.entityType}
                  {event.entityId ? (
                    <span className="block max-w-44 truncate text-xs text-stone-500">
                      {event.entityId}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="max-w-64 text-xs text-stone-600">
                  {Object.entries(event.metadata).length
                    ? Object.entries(event.metadata)
                        .map(([key, value]) => `${key}: ${String(value)}`)
                        .join(' · ')
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <nav aria-label="Activity pages" className="mt-5 flex items-center justify-between">
        <p className="text-sm text-stone-600">
          {activity.total} events · page {page} of {pages}
        </p>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link className={cn(buttonVariants({variant: 'outline'}))} href={pageHref(filters, page - 1)}>
              Previous
            </Link>
          ) : null}
          {page < pages ? (
            <Link className={cn(buttonVariants({variant: 'outline'}))} href={pageHref(filters, page + 1)}>
              Next
            </Link>
          ) : null}
        </div>
      </nav>
    </section>
  )
}
