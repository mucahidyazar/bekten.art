import {createHash} from 'node:crypto'

const TESTIMONIAL_CATEGORIES = Object.freeze({
  artist: 'ARTIST',
  businessman: 'BUSINESSPERSON',
  businessperson: 'BUSINESSPERSON',
  collector: 'COLLECTOR',
  critic: 'CRITIC',
  curator: 'CURATOR',
  journalist: 'JOURNALIST',
  politician: 'POLITICIAN',
})

const NEWS_CATEGORIES = new Set([
  'NEWS',
  'FEATURE',
  'INTERVIEW',
  'EXHIBITION',
  'BIOGRAPHY',
])

function asRecord(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }

  return value
}

function requiredString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} is required`)
  }

  return value.trim()
}

function optionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function migratedImageUrl(value) {
  const candidate = optionalString(value)

  if (!candidate || /(?:empty-event-image|placeholder|no-image)/iu.test(candidate)) {
    return null
  }

  if (
    /^\/img\/[a-z0-9/_-]+\.(?:avif|jpe?g|png|webp)$/iu.test(candidate) ||
    /^\/api\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      candidate,
    )
  ) {
    return candidate
  }

  return null
}

function optionalDate(value, label) {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.valueOf())) {
    throw new Error(`${label} must be a valid date`)
  }

  return date
}

function finiteNumber(value, fallback = null) {
  const parsed = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

function publication(row, locale, model) {
  const active = row.is_active === true
  const updatedAt = optionalDate(row.updated_at, `${model}.updated_at`)
  const createdAt = optionalDate(row.created_at, `${model}.created_at`)

  if (!createdAt || !updatedAt) {
    throw new Error(`${model} timestamps are required`)
  }

  return {
    createdAt,
    displayOrder: Math.max(0, Math.trunc(finiteNumber(row.order, 0))),
    id: deterministicUuid(`${model}:${locale}:${row.id}`),
    locale,
    publishedAt: active ? updatedAt : null,
    status: active ? 'PUBLISHED' : 'ARCHIVED',
    updatedAt,
  }
}

function dimensions(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const width = finiteNumber(value.width)
  const height = finiteNumber(value.height)

  if (width === null || height === null) {
    return null
  }

  const unit = value.unit === 'in' ? 'in' : 'cm'
  const depth = finiteNumber(value.depth)

  return depth === null
    ? `${width} × ${height} ${unit}`
    : `${width} × ${height} × ${depth} ${unit}`
}

function artwork(row, data, locale) {
  const title = requiredString(data.title, 'store.title')
  const imageUrl = migratedImageUrl(data.imageUrl)

  if (!imageUrl) {
    return null
  }

  const price = finiteNumber(data.price)
  const currency =
    typeof data.currency === 'string' && /^[A-Za-z]{3}$/.test(data.currency)
      ? data.currency.toUpperCase()
      : price === null
        ? null
        : 'USD'

  return {
    ...publication(row, locale, 'artwork'),
    currency,
    description: optionalString(data.description) ?? title,
    dimensions: dimensions(data.dimensions),
    imageAlt: title,
    imageUrl,
    isAvailable: data.availability === 'available',
    medium: optionalString(data.medium),
    objectKey: null,
    priceMinor: price === null ? null : Math.max(0, Math.round(price * 100)),
    slug: toSlug(title, String(row.id).slice(0, 8)),
    title,
    year: finiteNumber(data.year),
  }
}

function artistStat(row, data, locale) {
  return {
    ...publication(row, locale, 'artist-stat'),
    description: requiredString(data.description, 'artist.description'),
    label: requiredString(data.title, 'artist.title'),
    value: requiredString(data.number, 'artist.number'),
  }
}

function memory(row, data, locale) {
  const title = requiredString(data.title, 'memories.title')
  const imageUrl = migratedImageUrl(data.url)

  if (!imageUrl) {
    throw new Error('memories.url must reference a first-party image')
  }

  return {
    ...publication(row, locale, 'memory'),
    capturedAt: null,
    description: requiredString(data.description, 'memories.description'),
    imageAlt: title,
    imageUrl,
    objectKey: null,
    slug: toSlug(title, String(row.id).slice(0, 8)),
    title,
  }
}

function newsArticle(row, data, locale) {
  const title = requiredString(data.title, 'news.title')
  const body = requiredString(data.description, 'news.description')
  const rawCategory = String(data.category || 'news').toUpperCase()
  const imageUrl = migratedImageUrl(data.image)

  return {
    ...publication(row, locale, 'news-article'),
    address: optionalString(data.address),
    body,
    category: NEWS_CATEGORIES.has(rawCategory) ? rawCategory : 'NEWS',
    eventAt: optionalDate(data.date, 'news.date'),
    excerpt: body.slice(0, 1_000),
    imageAlt: imageUrl ? title : null,
    imageUrl,
    location: optionalString(data.location),
    note: optionalString(data.note),
    objectKey: null,
    slug: toSlug(title, String(row.id).slice(0, 8)),
    sourceUrl: optionalString(data.source),
    subtitle: optionalString(data.subtitle),
    title,
  }
}

function testimonial(row, data, locale) {
  const avatarUrl = migratedImageUrl(data.avatar)
  const rawCategory = String(data.category || 'artist').toLowerCase()

  return {
    ...publication(row, locale, 'testimonial'),
    avatarAlt: avatarUrl
      ? `${requiredString(data.name, 'testimonial.name')} portrait`
      : null,
    avatarUrl,
    category: TESTIMONIAL_CATEGORIES[rawCategory] ?? 'ARTIST',
    company: optionalString(data.company),
    location: optionalString(data.location),
    name: requiredString(data.name, 'testimonial.name'),
    objectKey: null,
    quote: requiredString(data.quote, 'testimonial.quote'),
    sourceUrl: optionalString(data.source),
    title: requiredString(data.title, 'testimonial.title'),
  }
}

function workshopItem(row, data, locale) {
  const title = requiredString(data.title, 'workshop.title')
  const imageUrl = migratedImageUrl(data.url)

  return {
    ...publication(row, locale, 'workshop-item'),
    description: requiredString(data.description, 'workshop.description'),
    endsAt: null,
    imageAlt: imageUrl ? title : null,
    imageUrl,
    location: null,
    objectKey: null,
    registrationUrl: null,
    slug: toSlug(title, String(row.id).slice(0, 8)),
    startsAt: null,
    title,
  }
}

export function buildTypedContentRows(legacyRows, locales) {
  const result = {
    artistStats: [],
    artworks: [],
    memories: [],
    newsArticles: [],
    testimonials: [],
    workshopItems: [],
  }

  for (const rawRow of legacyRows) {
    const row = asRecord(rawRow, 'legacy row')
    const data = asRecord(row.data, `${row.section_type}.data`)

    for (const locale of locales) {
      switch (row.section_type) {
        case 'artist':
          result.artistStats.push(artistStat(row, data, locale))
          break
        case 'memories':
          result.memories.push(memory(row, data, locale))
          break
        case 'news':
          result.newsArticles.push(newsArticle(row, data, locale))
          break
        case 'store':
          {
            const item = artwork(row, data, locale)

            if (item) {
              result.artworks.push(item)
            }
          }
          break
        case 'testimonials':
          result.testimonials.push(testimonial(row, data, locale))
          break
        case 'workshop':
          result.workshopItems.push(workshopItem(row, data, locale))
          break
        default:
          throw new Error(`Unsupported legacy section type: ${row.section_type}`)
      }
    }
  }

  return result
}

export function deterministicUuid(value) {
  const bytes = createHash('sha256').update(value).digest().subarray(0, 16)

  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = bytes.toString('hex')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function toSlug(title, suffix) {
  const normalized = String(title)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const safeSuffix = String(suffix)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8)
  const maximumBaseLength = 160 - safeSuffix.length - 1
  const base = (normalized || 'item')
    .slice(0, maximumBaseLength)
    .replace(/-+$/g, '')

  return `${base || 'item'}-${safeSuffix}`
}
