import {z} from 'zod'

import {
  artworkEditSchema,
  collectionEditSchema,
  exhibitionEditSchema,
  journalEntryEditSchema,
  pageEditSchema,
  pressEntryEditSchema,
} from '@/server/editorial-content'

import type {EditorialEntityType} from '@/server/editorial-publishing'

const MAX_MEDIA_PLACEMENTS_JSON_BYTES = 100_000
const dateInputSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

function text(formData: FormData, name: string) {
  const value = formData.get(name)

  return typeof value === 'string' ? value : ''
}

function nullableText(formData: FormData, name: string) {
  const value = text(formData, name).trim()

  return value.length > 0 ? value : null
}

function nullableInteger(formData: FormData, name: string) {
  const value = text(formData, name).trim()

  return value.length > 0 ? Number(value) : null
}

function date(formData: FormData, name: string) {
  const value = dateInputSchema.parse(text(formData, name))

  return new Date(`${value}T00:00:00.000Z`)
}

function nullableDate(formData: FormData, name: string) {
  const value = text(formData, name).trim()

  return value.length > 0
    ? new Date(`${dateInputSchema.parse(value)}T00:00:00.000Z`)
    : null
}

function mediaPlacements(formData: FormData) {
  const value = text(formData, 'media-placements') || '[]'

  if (Buffer.byteLength(value, 'utf8') > MAX_MEDIA_PLACEMENTS_JSON_BYTES) {
    throw new Error('STUDIO_MEDIA_PLACEMENTS_TOO_LARGE')
  }

  const parsed: unknown = JSON.parse(value)

  return z.array(z.unknown()).max(100).parse(parsed)
}

function common(formData: FormData) {
  return {
    displayOrder: Number(text(formData, 'display-order')),
    locale: text(formData, 'locale'),
    mediaPlacements: mediaPlacements(formData),
    seo: {
      canonicalPath: text(formData, 'canonical-path'),
      description: text(formData, 'seo-description'),
      noIndex: text(formData, 'no-index') === 'on',
      title: text(formData, 'seo-title'),
    },
    slug: text(formData, 'slug'),
  }
}

export function parseEditorialFormData(
  entityType: EditorialEntityType,
  formData: FormData,
) {
  const shared = common(formData)

  switch (entityType) {
    case 'ARTWORK':
      return artworkEditSchema.parse({
        ...shared,
        availability: text(formData, 'availability'),
        collectionId: nullableText(formData, 'collection-id'),
        description: text(formData, 'description'),
        dimensions: nullableText(formData, 'dimensions'),
        medium: nullableText(formData, 'medium'),
        title: text(formData, 'title'),
        year: nullableInteger(formData, 'year'),
      })
    case 'COLLECTION':
      return collectionEditSchema.parse({
        ...shared,
        description: text(formData, 'description'),
        title: text(formData, 'title'),
      })
    case 'EXHIBITION':
      return exhibitionEditSchema.parse({
        ...shared,
        body: text(formData, 'body'),
        city: nullableText(formData, 'city'),
        country: nullableText(formData, 'country'),
        endsAt: nullableDate(formData, 'ends-at'),
        startsAt: date(formData, 'starts-at'),
        subtitle: nullableText(formData, 'subtitle'),
        title: text(formData, 'title'),
        venue: nullableText(formData, 'venue'),
      })
    case 'JOURNAL_ENTRY':
      return journalEntryEditSchema.parse({
        ...shared,
        body: text(formData, 'body'),
        excerpt: text(formData, 'excerpt'),
        title: text(formData, 'title'),
      })
    case 'PAGE':
      return pageEditSchema.parse({
        ...shared,
        body: text(formData, 'body'),
        eyebrow: nullableText(formData, 'eyebrow'),
        title: text(formData, 'title'),
      })
    case 'PRESS_ENTRY':
      return pressEntryEditSchema.parse({
        ...shared,
        body: nullableText(formData, 'body'),
        excerpt: text(formData, 'excerpt'),
        outlet: text(formData, 'outlet'),
        pressCategory: text(formData, 'press-category'),
        publishedOn: nullableDate(formData, 'published-on'),
        sourceUrl: text(formData, 'source-url'),
        subtitle: nullableText(formData, 'subtitle'),
        title: text(formData, 'title'),
      })
  }
}
