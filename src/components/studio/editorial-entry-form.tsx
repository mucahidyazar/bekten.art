'use client'

import Link from 'next/link'

import {useActionState} from 'react'

import {INITIAL_STUDIO_ACTION_STATE} from './editorial-action-state'
import {EditorialMediaPlacements} from './editorial-media-placements'

import type {StudioActionState} from './editorial-action-state'
import type {StudioAvailableMedia} from './editorial-media-placements'
import type {ContentMediaPlacementEdit} from '@/server/editorial-content'
import type {EditorialEntityType} from '@/server/editorial-publishing'

type FieldDefinition = Readonly<{
  label: string
  name: string
  options?: readonly Readonly<{label: string; value: string}>[]
  required?: boolean
  rows?: number
  type?: 'date' | 'number' | 'text' | 'url'
}>

type EditorialEntryFormProps = Readonly<{
  action: (
    state: StudioActionState,
    formData: FormData,
  ) => Promise<StudioActionState>
  availableMedia?: readonly StudioAvailableMedia[]
  entityId: string | null
  entityType: EditorialEntityType
  initialValue: Readonly<Record<string, unknown>>
  status: 'ARCHIVED' | 'DRAFT' | 'PUBLISHED' | null
}>

const routeSegments = Object.freeze({
  ARTWORK: 'artworks',
  COLLECTION: 'collections',
  EXHIBITION: 'exhibitions',
  JOURNAL_ENTRY: 'journal',
  PAGE: 'pages',
  PRESS_ENTRY: 'press',
}) satisfies Readonly<Record<EditorialEntityType, string>>

const entityFields = Object.freeze({
  ARTWORK: [
    {label: 'Title', name: 'title', required: true},
    {label: 'Description', name: 'description', required: true, rows: 7},
    {label: 'Year', name: 'year', type: 'number'},
    {label: 'Medium', name: 'medium'},
    {label: 'Dimensions', name: 'dimensions'},
    {
      label: 'Availability',
      name: 'availability',
      options: [
        {label: 'Available', value: 'AVAILABLE'},
        {label: 'Available on request', value: 'ON_REQUEST'},
        {label: 'Reserved', value: 'RESERVED'},
        {label: 'Not available', value: 'NOT_AVAILABLE'},
      ],
      required: true,
    },
    {label: 'Collection ID', name: 'collection-id'},
  ],
  COLLECTION: [
    {label: 'Title', name: 'title', required: true},
    {label: 'Description', name: 'description', required: true, rows: 7},
  ],
  EXHIBITION: [
    {label: 'Title', name: 'title', required: true},
    {label: 'Subtitle', name: 'subtitle'},
    {label: 'Body', name: 'body', required: true, rows: 12},
    {label: 'Starts on', name: 'starts-at', required: true, type: 'date'},
    {label: 'Ends on', name: 'ends-at', type: 'date'},
    {label: 'Venue', name: 'venue'},
    {label: 'City', name: 'city'},
    {label: 'Country', name: 'country'},
  ],
  JOURNAL_ENTRY: [
    {label: 'Title', name: 'title', required: true},
    {label: 'Excerpt', name: 'excerpt', required: true, rows: 4},
    {label: 'Body', name: 'body', required: true, rows: 14},
  ],
  PAGE: [
    {label: 'Title', name: 'title', required: true},
    {label: 'Eyebrow', name: 'eyebrow'},
    {label: 'Body', name: 'body', required: true, rows: 14},
  ],
  PRESS_ENTRY: [
    {label: 'Title', name: 'title', required: true},
    {label: 'Subtitle', name: 'subtitle'},
    {label: 'Excerpt', name: 'excerpt', required: true, rows: 5},
    {label: 'Body', name: 'body', rows: 10},
    {label: 'Outlet', name: 'outlet', required: true},
    {label: 'Source URL', name: 'source-url', required: true, type: 'url'},
    {label: 'Published on', name: 'published-on', type: 'date'},
    {
      label: 'Press category',
      name: 'press-category',
      options: [
        {label: 'Interview', value: 'INTERVIEW'},
        {label: 'Review', value: 'REVIEW'},
        {label: 'Feature', value: 'FEATURE'},
        {label: 'News', value: 'NEWS'},
      ],
      required: true,
    },
  ],
}) satisfies Readonly<Record<EditorialEntityType, readonly FieldDefinition[]>>

const fieldClassName =
  'mt-2 min-h-11 w-full border border-stone-500/70 bg-[#fffaf0] px-3 py-2 text-stone-950 outline-none focus-visible:border-red-900 focus-visible:ring-2 focus-visible:ring-red-900/20'

function camelCase(name: string) {
  return name.replace(/-([a-z])/g, (_match, letter: string) =>
    letter.toUpperCase(),
  )
}

function inputValue(
  initialValue: Readonly<Record<string, unknown>>,
  name: string,
) {
  const value = initialValue[camelCase(name)]

  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value

  return ''
}

function editableMediaPlacements(
  initialValue: Readonly<Record<string, unknown>>,
) {
  const placements = initialValue.mediaPlacements

  if (!Array.isArray(placements)) return []

  return placements.map(placement => {
    const value = placement as Readonly<Record<string, unknown>>

    return {
      altText: value.altText,
      caption: value.caption ?? null,
      credit: value.credit ?? null,
      crop: value.crop,
      displayOrder: value.displayOrder,
      focalPoint: value.focalPoint ?? null,
      mediaObjectId: value.mediaObjectId,
      role: value.role,
    }
  })
}

function FormField({
  definition,
  initialValue,
}: Readonly<{
  definition: FieldDefinition
  initialValue: Readonly<Record<string, unknown>>
}>) {
  const value = inputValue(initialValue, definition.name)

  return (
    <label className={definition.rows ? 'md:col-span-2' : ''}>
      <span className="text-sm font-semibold text-stone-800">
        {definition.label}
      </span>
      {definition.options ? (
        <select
          className={fieldClassName}
          defaultValue={value || definition.options[0]?.value}
          name={definition.name}
          required={definition.required}
        >
          {definition.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : definition.rows ? (
        <textarea
          className={fieldClassName}
          defaultValue={value}
          name={definition.name}
          required={definition.required}
          rows={definition.rows}
        />
      ) : (
        <input
          className={fieldClassName}
          defaultValue={value}
          name={definition.name}
          required={definition.required}
          type={definition.type ?? 'text'}
        />
      )}
    </label>
  )
}

export function EditorialEntryForm({
  action,
  availableMedia = [],
  entityId,
  entityType,
  initialValue,
  status,
}: EditorialEntryFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_STUDIO_ACTION_STATE,
  )
  const seo = (initialValue.seo ?? {}) as Readonly<Record<string, unknown>>

  return (
    <form action={formAction} className="mt-10 space-y-10">
      {state.status === 'error' ? (
        <p
          className="border border-red-900/30 bg-red-50 p-4 text-red-950"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <fieldset className="grid gap-5 border-t border-stone-400/70 pt-7 md:grid-cols-2">
        <legend className="px-2 font-serif text-2xl">Editorial record</legend>
        <label>
          <span className="text-sm font-semibold text-stone-800">Locale</span>
          <select
            className={fieldClassName}
            defaultValue={inputValue(initialValue, 'locale') || 'en'}
            name="locale"
            required
          >
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
            <option value="ru">Русский</option>
            <option value="ky">Кыргызча</option>
          </select>
        </label>
        <label>
          <span className="text-sm font-semibold text-stone-800">Slug</span>
          <input
            className={fieldClassName}
            defaultValue={inputValue(initialValue, 'slug')}
            name="slug"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
          />
        </label>
        <label>
          <span className="text-sm font-semibold text-stone-800">
            Display order
          </span>
          <input
            className={fieldClassName}
            defaultValue={inputValue(initialValue, 'display-order') || '0'}
            min="0"
            name="display-order"
            required
            type="number"
          />
        </label>
        {entityFields[entityType].map(definition => (
          <FormField
            definition={definition}
            initialValue={initialValue}
            key={definition.name}
          />
        ))}
      </fieldset>

      <EditorialMediaPlacements
        availableMedia={availableMedia}
        entityType={entityType}
        initialPlacements={
          editableMediaPlacements(
            initialValue,
          ) as readonly ContentMediaPlacementEdit[]
        }
      />

      <fieldset className="grid gap-5 border-t border-stone-400/70 pt-7 md:grid-cols-2">
        <legend className="px-2 font-serif text-2xl">Search appearance</legend>
        <label>
          <span className="text-sm font-semibold text-stone-800">
            SEO title
          </span>
          <input
            className={fieldClassName}
            defaultValue={inputValue(seo, 'title')}
            maxLength={70}
            name="seo-title"
            required
          />
        </label>
        <label>
          <span className="text-sm font-semibold text-stone-800">
            Canonical path
          </span>
          <input
            className={fieldClassName}
            defaultValue={inputValue(seo, 'canonical-path')}
            name="canonical-path"
            required
          />
        </label>
        <label className="md:col-span-2">
          <span className="text-sm font-semibold text-stone-800">
            SEO description
          </span>
          <textarea
            className={fieldClassName}
            defaultValue={inputValue(seo, 'description')}
            maxLength={170}
            minLength={50}
            name="seo-description"
            required
            rows={4}
          />
        </label>
        <label className="flex min-h-11 items-center gap-3 md:col-span-2">
          <input
            defaultChecked={seo.noIndex === true}
            name="no-index"
            type="checkbox"
          />
          <span>Hide this record from search engines</span>
        </label>
      </fieldset>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-stone-400/70 bg-[#eee6d5]/95 py-5 backdrop-blur">
        <button
          className="min-h-11 bg-stone-950 px-5 py-3 font-semibold text-white disabled:opacity-50"
          disabled={pending}
          name="intent"
          type="submit"
          value="save"
        >
          {pending ? 'Saving…' : 'Save draft'}
        </button>
        {entityId ? (
          <button
            className="min-h-11 border border-red-900 px-5 py-3 font-semibold text-red-950 disabled:opacity-50"
            disabled={pending}
            name="intent"
            type="submit"
            value="publish"
          >
            Publish
          </button>
        ) : null}
        {entityId ? (
          <>
            <Link
              className="inline-flex min-h-11 items-center px-4 py-3 font-semibold underline underline-offset-4"
              href={`/dashboard/${routeSegments[entityType]}/${entityId}/preview`}
            >
              Preview draft
            </Link>
            {status !== 'ARCHIVED' ? (
              <button
                className="ml-auto min-h-11 px-4 py-3 font-semibold text-red-900 underline underline-offset-4 disabled:opacity-50"
                disabled={pending}
                name="intent"
                type="submit"
                value="archive"
              >
                Archive
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </form>
  )
}
