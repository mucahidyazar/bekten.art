import Link from 'next/link'

import {z} from 'zod'

import {NAV_FORWARD_TRANSITION} from '@/components/public-site/public-view-transition'
import {
  StudioEmptyState,
  StudioPageHeader,
} from '@/components/studio/studio-dashboard-components'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {inquiryStatusSchema} from '@/server/inquiries/inquiry-validation'
import {requireStudioEditor} from '@/server/studio-auth/configured-access'
import {configuredStudioInquiryService} from '@/server/studio-inquiries/configured-studio-inquiry-service'

const inquiryTypeSchema = z.enum([
  'AVAILABILITY',
  'COLLECTOR',
  'COMMISSION',
  'GENERAL',
  'PRIVATE_VIEWING',
])
const rowSchema = z.object({
  createdAt: z.date(),
  email: z.email(),
  id: z.string().uuid(),
  labels: z.array(z.string()),
  locale: z.enum(['en', 'tr', 'ru', 'ky']),
  name: z.string(),
  relatedArtworkTitle: z.string().nullable(),
  status: inquiryStatusSchema,
  subject: z.string().nullable(),
  type: inquiryTypeSchema,
  updatedAt: z.date(),
})

function first(value: string | readonly string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function StudioInquiriesPage({
  searchParams,
}: PageProps<'/[locale]/dashboard/inquiries'>) {
  await requireStudioEditor()

  const parameters = await searchParams
  const status = inquiryStatusSchema
    .optional()
    .catch(undefined)
    .parse(first(parameters.status) || undefined)
  const type = inquiryTypeSchema
    .optional()
    .catch(undefined)
    .parse(first(parameters.type) || undefined)
  const inquiries = (
    await configuredStudioInquiryService.list({
      limit: 100,
      ...(status ? {status} : {}),
      ...(type ? {type} : {}),
    })
  ).map(row => rowSchema.parse(row))

  return (
    <section aria-labelledby="inquiry-inbox-title">
      <StudioPageHeader
        description="Availability, commission, private viewing, and general requests in one private editorial queue."
        eyebrow="Collector relations"
        title="Inquiry inbox"
        titleId="inquiry-inbox-title"
      />

      <Card className="mt-8 border-stone-500/35 bg-[#f7f1e6] shadow-none">
        <CardContent className="p-4 sm:p-5">
          <form className="flex flex-wrap items-end gap-4">
            <label className="grid min-w-44 gap-2 text-sm font-semibold">
              Status
              <select
                className="min-h-11 rounded-md border border-stone-500/40 bg-[#fffaf0] px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[#6f2a1a]/35"
                defaultValue={status ?? ''}
                name="status"
              >
                <option value="">All</option>
                <option value="NEW">New</option>
                <option value="IN_REVIEW">In review</option>
                <option value="RESPONDED">Responded</option>
                <option value="CLOSED">Closed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <label className="grid min-w-44 gap-2 text-sm font-semibold">
              Request type
              <select
                className="min-h-11 rounded-md border border-stone-500/40 bg-[#fffaf0] px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[#6f2a1a]/35"
                defaultValue={type ?? ''}
                name="type"
              >
                <option value="">All</option>
                <option value="AVAILABILITY">Availability</option>
                <option value="COLLECTOR">Collector</option>
                <option value="COMMISSION">Commission</option>
                <option value="PRIVATE_VIEWING">Private viewing</option>
                <option value="GENERAL">General</option>
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

      {inquiries.length === 0 ? (
        <div className="mt-8">
          <StudioEmptyState
            description="New collector requests will appear here automatically."
            title="No matching inquiries."
          />
        </div>
      ) : (
        <ol className="mt-8 grid gap-3">
          {inquiries.map(inquiry => (
            <li key={inquiry.id}>
              <Card className="border-stone-500/30 bg-[#f7f1e6] shadow-none transition-colors hover:border-[#6f2a1a]/50">
                <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <Link
                      className="font-serif text-2xl underline decoration-stone-400 underline-offset-4 hover:decoration-[#6f2a1a]"
                      href={`/dashboard/inquiries/${inquiry.id}`}
                      transitionTypes={[...NAV_FORWARD_TRANSITION]}
                    >
                      {inquiry.name}
                    </Link>
                    <p className="mt-2 text-sm text-stone-600">
                      {inquiry.type.replaceAll('_', ' ')} · {inquiry.email} ·{' '}
                      {inquiry.createdAt.toISOString().slice(0, 10)}
                    </p>
                    {inquiry.relatedArtworkTitle ? (
                      <p className="mt-1 font-semibold">
                        {inquiry.relatedArtworkTitle}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase">
                    <Badge
                      className="border-[#9a7b42]/45 bg-[#e7dcc6] text-stone-800"
                      variant="outline"
                    >
                      {inquiry.status.replaceAll('_', ' ')}
                    </Badge>
                    {inquiry.labels.map(label => (
                      <Badge key={label} variant="muted">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
