import type {
  EditorialEntityType,
  EditorialSnapshot,
} from '../../src/server/editorial-publishing/contracts'

export type V2DemoContent = Readonly<{
  delegate:
    | 'artwork'
    | 'collection'
    | 'exhibition'
    | 'journalEntry'
    | 'page'
    | 'pressItem'
  entityId: string
  entityType: EditorialEntityType
  identity: string
  placements: readonly V2DemoPlacement[]
  revision: Readonly<{
    entityId: string
    entityType: EditorialEntityType
    id: string
    locale: 'en' | 'ky' | 'ru' | 'tr'
    operation: 'PUBLISH'
    snapshot: EditorialSnapshot
    version: number
  }>
  row: Readonly<{
    id: string
    locale: 'en' | 'ky' | 'ru' | 'tr'
    publishedAt: Date
    slug: string
    status: 'PUBLISHED'
    title: string
    version: number
    [key: string]: unknown
  }>
  segment: '' | 'collections' | 'exhibitions' | 'journal' | 'press' | 'works'
}>

export type V2DemoMedia = Readonly<{
  assetPath: string
  checksumSha256: string
  filename: string
  height: number
  id: string
  mimeType: string
  objectKey: string
  sizeBytes: number
  width: number
}>

export type V2DemoPlacement = Readonly<{
  altText: string
  caption: string | null
  credit: string | null
  crop: 'LANDSCAPE' | 'ORIGINAL' | 'PORTRAIT' | 'SQUARE'
  displayOrder: number
  entityId: string
  entityType: EditorialEntityType
  focalPoint: Readonly<{x: number; y: number}> | null
  id: string
  mediaObjectId: string
  role: 'GALLERY' | 'HERO' | 'INLINE' | 'SEO' | 'THUMBNAIL'
}>

export function assertDemoSeedAllowed(
  environment: Readonly<Record<string, string | undefined>>,
): void

export function createDemoSeedPlan(): Readonly<{
  content: readonly V2DemoContent[]
  media: readonly V2DemoMedia[]
}>

export function executeDemoSeedPlan(
  input: Readonly<{
    content?: readonly V2DemoContent[]
    database: unknown
    environment: Readonly<Record<string, string | undefined>>
    media?: readonly V2DemoMedia[]
    uploadAsset: (media: V2DemoMedia) => Promise<void>
  }>,
): Promise<Readonly<{created: number; existing: number; media: number}>>
