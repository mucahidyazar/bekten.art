import Image from 'next/image'

import {z} from 'zod'

import {
  contentMediaPlacementEditSchema,
  editorialLocaleSchema,
} from '@/server/editorial-content'

const optionalText = z.string().trim().min(1).optional().nullable()
const editorialDetailSchema = z
  .object({
    availability: z
      .enum(['AVAILABLE', 'ON_REQUEST', 'RESERVED', 'NOT_AVAILABLE'])
      .optional(),
    body: optionalText,
    city: optionalText,
    country: optionalText,
    description: optionalText,
    dimensions: optionalText,
    endsAt: z.date().optional().nullable(),
    eyebrow: optionalText,
    excerpt: optionalText,
    locale: editorialLocaleSchema,
    mediaPlacements: z
      .array(contentMediaPlacementEditSchema.passthrough())
      .default([]),
    medium: optionalText,
    outlet: optionalText,
    pressCategory: z
      .enum(['INTERVIEW', 'REVIEW', 'FEATURE', 'NEWS'])
      .optional(),
    publishedOn: z.date().optional().nullable(),
    startsAt: z.date().optional().nullable(),
    subtitle: optionalText,
    sourceUrl: z.string().url().startsWith('https://').optional().nullable(),
    title: z.string().trim().min(1).max(200),
    venue: optionalText,
    year: z.number().int().min(1000).max(3000).optional().nullable(),
  })
  .passthrough()

const availabilityLabels = {
  AVAILABLE: 'Available',
  NOT_AVAILABLE: 'Not available',
  ON_REQUEST: 'On request',
  RESERVED: 'Reserved',
} as const

type EditorialDetailProps = Readonly<{
  content: unknown
  entityLabel: string
  headingId: string
}>

function formattedDate(value: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(value)
}

export function EditorialDetail({
  content: contentInput,
  entityLabel,
  headingId,
}: EditorialDetailProps) {
  const content = editorialDetailSchema.parse(contentInput)
  const placements = [...content.mediaPlacements].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  )
  const hero = placements.find(({role}) => role === 'HERO')
  const supportingMedia = placements.filter(
    ({mediaObjectId, role}) =>
      mediaObjectId !== hero?.mediaObjectId && role !== 'SEO',
  )
  const introduction =
    content.description ?? content.excerpt ?? content.subtitle
  const location = [content.city, content.country].filter(Boolean).join(', ')
  const venue = [content.venue, location].filter(Boolean).join(' · ')
  const dateRange = content.startsAt
    ? [
        formattedDate(content.startsAt, content.locale),
        content.endsAt ? formattedDate(content.endsAt, content.locale) : null,
      ]
        .filter(Boolean)
        .join(' — ')
    : null
  const details = [
    content.year ? {label: 'Year', value: String(content.year)} : null,
    content.medium ? {label: 'Medium', value: content.medium} : null,
    content.dimensions
      ? {label: 'Dimensions', value: content.dimensions}
      : null,
    content.availability
      ? {
          label: 'Availability',
          value: availabilityLabels[content.availability],
        }
      : null,
    venue ? {label: 'Venue', value: venue} : null,
    dateRange ? {label: 'Dates', value: dateRange} : null,
    content.outlet ? {label: 'Outlet', value: content.outlet} : null,
    content.pressCategory
      ? {
          label: 'Category',
          value:
            content.pressCategory.charAt(0) +
            content.pressCategory.slice(1).toLowerCase(),
        }
      : null,
    content.publishedOn
      ? {
          label: 'Published',
          value: formattedDate(content.publishedOn, content.locale),
        }
      : null,
  ].filter(
    (detail): detail is {label: string; value: string} => detail !== null,
  )

  return (
    <article aria-labelledby={headingId}>
      <header className="grid gap-10 border-b border-stone-400/60 pb-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-end">
        <div>
          <p className="text-xs tracking-[0.2em] text-red-900 uppercase">
            {[entityLabel, content.eyebrow].filter(Boolean).join(' · ')}
          </p>
          <h1
            className="mt-4 font-serif text-5xl leading-tight tracking-tight sm:text-7xl"
            id={headingId}
          >
            {content.title}
          </h1>
          {introduction ? (
            <p className="mt-6 max-w-2xl text-xl leading-8 text-stone-700">
              {introduction}
            </p>
          ) : null}
        </div>
        {details.length > 0 ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-stone-400/60 pt-5 text-sm">
            {details.map(detail => (
              <div key={detail.label}>
                <dt className="text-stone-600">{detail.label}</dt>
                <dd className="mt-1 font-semibold">{detail.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </header>

      {content.sourceUrl ? (
        <a
          className="mt-6 inline-flex min-h-11 items-center font-semibold text-red-900 underline underline-offset-4"
          href={content.sourceUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Read original source
        </a>
      ) : null}

      {hero ? (
        <figure className="mt-10">
          <div className="relative aspect-[16/10] overflow-hidden bg-stone-200">
            <Image
              alt={hero.altText}
              className="object-contain"
              fill
              priority
              sizes="(min-width: 1280px) 1120px, 94vw"
              src={`/api/media/${hero.mediaObjectId}`}
              unoptimized
            />
          </div>
          {hero.caption || hero.credit ? (
            <figcaption className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-stone-600">
              {hero.caption ? <span>{hero.caption}</span> : <span />}
              {hero.credit ? <span>{hero.credit}</span> : null}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      {content.body ? (
        <div className="mt-12 max-w-3xl text-lg leading-9 whitespace-pre-wrap">
          {content.body}
        </div>
      ) : null}

      {supportingMedia.length > 0 ? (
        <ul
          aria-label={`${content.title} media`}
          className="mt-12 grid gap-6 md:grid-cols-2"
        >
          {supportingMedia.map(media => (
            <li key={media.mediaObjectId}>
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
                  <Image
                    alt={media.altText}
                    className="object-contain"
                    fill
                    sizes="(min-width: 768px) 45vw, 94vw"
                    src={`/api/media/${media.mediaObjectId}`}
                    unoptimized
                  />
                </div>
                {media.caption || media.credit ? (
                  <figcaption className="mt-3 text-sm text-stone-600">
                    {[media.caption, media.credit].filter(Boolean).join(' · ')}
                  </figcaption>
                ) : null}
              </figure>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
