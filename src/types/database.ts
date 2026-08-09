export type ArtistDatabaseData = DatabaseSectionData<ArtistItemData, 'artist'>

export type ArtistDatabaseItem = ArtistDatabaseData

export type ArtistDatabaseSection = DatabaseSection<'artist'>

export type ArtistDatabaseSettings = ArtistDatabaseSection
export interface ArtistItemData {
  description: string
  number: string
  title: string
}

export interface DatabaseSection<
  TSection extends LegacySectionType = LegacySectionType,
> {
  badge_text: string
  created_at: string
  display_order: number
  id: string
  is_active: boolean
  max_items: number
  section_description: string
  section_title: string
  section_type: TSection
  updated_at: string
}
export interface DatabaseSectionData<
  TData = unknown,
  TSection extends LegacySectionType = LegacySectionType,
> {
  created_at: string
  data: TData
  id: string
  is_active: boolean
  order: number
  section_type: TSection
  updated_at: string
}
export type DatabaseSectionItem = DatabaseSectionData
export type DatabaseSectionSettings = DatabaseSection
export type LegacySectionType =
  | 'workshop'
  | 'gallery'
  | 'portfolio'
  | 'testimonials'
  | 'services'
  | 'artist'
  | 'memories'
  | 'store'
  | 'news'

export type MemoriesDatabaseData = DatabaseSectionData<
  MemoriesItemData,
  'memories'
>
export type MemoriesDatabaseItem = MemoriesDatabaseData
export type MemoriesDatabaseSection = DatabaseSection<'memories'>
export type MemoriesDatabaseSettings = MemoriesDatabaseSection
export interface MemoriesItemData {
  description: string
  title: string
  url: string
}

export type NewsCategory =
  | 'news'
  | 'feature'
  | 'interview'
  | 'exhibition'
  | 'biography'

export type NewsDatabaseData = DatabaseSectionData<NewsItemData, 'news'>
export type NewsDatabaseItem = NewsDatabaseData
export type NewsDatabaseSection = DatabaseSection<'news'>
export type NewsDatabaseSettings = NewsDatabaseSection
export interface NewsItemData {
  address?: string
  category: NewsCategory
  date: string
  description: string
  image?: string
  location?: string
  note?: string
  source?: string
  subtitle?: string
  title: string
}

export type StoreCategory =
  | 'painting'
  | 'digital'
  | 'print'
  | 'sculpture'
  | 'portrait'
  | 'landscape'
  | 'mixed-media'

export type StoreDatabaseData = DatabaseSectionData<StoreItemData, 'store'>
export type StoreDatabaseItem = StoreDatabaseData
export type StoreDatabaseSection = DatabaseSection<'store'>
export type StoreDatabaseSettings = StoreDatabaseSection
export interface StoreItemData {
  availability: 'available' | 'sold' | 'reserved'
  category: StoreCategory
  currency: string
  description: string
  dimensions: {
    depth?: number
    height: number
    unit: 'cm' | 'in'
    width: number
  }
  editionNumber?: number
  editionSize?: number
  featured: boolean
  imageUrl: string
  images: string[]
  isLimitedEdition: boolean
  isOriginal: boolean
  medium: string
  originalPrice?: number
  price: number
  tags: string[]
  title: string
  year: number
}

export type TestimonialCategory =
  | 'artist'
  | 'businessman'
  | 'politician'
  | 'collector'
  | 'critic'
  | 'journalist'
  | 'curator'

export type TestimonialDatabaseData = DatabaseSectionData<
  TestimonialItemData,
  'testimonials'
>
export type TestimonialDatabaseItem = TestimonialDatabaseData
export type TestimonialDatabaseSection = DatabaseSection<'testimonials'>
export type TestimonialDatabaseSettings = TestimonialDatabaseSection
export interface TestimonialItemData {
  avatar: string
  category: TestimonialCategory
  company: string
  location: string
  name: string
  quote: string
  source: string
  title: string
}

export type WorkshopDatabaseData = DatabaseSectionData<
  WorkshopItemData,
  'workshop'
>
export type WorkshopDatabaseItem = WorkshopDatabaseData
export type WorkshopDatabaseSection = DatabaseSection<'workshop'>
export type WorkshopDatabaseSettings = WorkshopDatabaseSection
export interface WorkshopItemData {
  description: string
  title: string
  url: string
}
