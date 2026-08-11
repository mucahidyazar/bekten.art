import Link from 'next/link'

import {z} from 'zod'

import {inquiryStatusSchema} from '@/server/inquiries/inquiry-validation'
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
}: PageProps<'/studio/inquiries'>) {
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
      <p className="text-xs font-semibold tracking-[0.2em] text-red-900 uppercase">
        Collector relations
      </p>
      <h1
        className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl"
        id="inquiry-inbox-title"
      >
        Inquiry inbox
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-stone-700">
        Availability, commission, private viewing, and general requests in one
        private editorial queue.
      </p>

      <form className="mt-8 flex flex-wrap gap-4 border-y border-stone-400/60 py-5">
        <label>
          <span className="mr-2 text-sm font-semibold">Status</span>
          <select
            className="min-h-11 border border-stone-500 bg-[#fffaf0] px-3"
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
        <label>
          <span className="mr-2 text-sm font-semibold">Request type</span>
          <select
            className="min-h-11 border border-stone-500 bg-[#fffaf0] px-3"
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
        <button
          className="min-h-11 border border-stone-700 px-4 py-2 font-semibold"
          type="submit"
        >
          Apply filters
        </button>
      </form>

      {inquiries.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-500/60 bg-white/30 p-8">
          <h2 className="font-serif text-2xl">No matching inquiries.</h2>
          <p className="mt-2 leading-7 text-stone-700">
            New collector requests will appear here automatically.
          </p>
        </div>
      ) : (
        <ol className="mt-8 divide-y divide-stone-400/60 border-y border-stone-400/60">
          {inquiries.map(inquiry => (
            <li
              className="grid gap-3 py-5 md:grid-cols-[1fr_auto] md:items-center"
              key={inquiry.id}
            >
              <div>
                <Link
                  className="font-serif text-2xl underline decoration-stone-400 underline-offset-4 hover:decoration-red-900"
                  href={`/studio/inquiries/${inquiry.id}`}
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
                <span className="border border-stone-500 px-2 py-1">
                  {inquiry.status.replaceAll('_', ' ')}
                </span>
                {inquiry.labels.map(label => (
                  <span className="bg-stone-200 px-2 py-1" key={label}>
                    {label}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
