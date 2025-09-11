// Combined types for artist
export interface ArtistDatabaseData extends DatabaseSectionData {
  section_type: 'artist'
  data: ArtistItemData
}

export interface ArtistDatabaseItem extends ArtistDatabaseData {}

export interface ArtistDatabaseSection extends DatabaseSection {
  section_type: 'artist'
}

export interface ArtistDatabaseSettings extends ArtistDatabaseSection {}

// Artist specific data structure (what goes in the data JSONB field)
export interface ArtistItemData {
  number: string
  title: string
  description: string
  [key: string]: any // Allow additional fields
}

// sections table
export interface DatabaseSection {
  id: string
  section_type:
    | 'workshop'
    | 'gallery'
    | 'portfolio'
    | 'testimonials'
    | 'services'
    | 'artist'
    | 'memories'
    | 'store'
    | 'news'
  section_title: string
  section_description: string
  badge_text: string
  max_items: number
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

// Raw database types - matches Supabase schema exactly
// section_data table
export interface DatabaseSectionData {
  id: string
  section_type:
    | 'workshop'
    | 'gallery'
    | 'portfolio'
    | 'testimonials'
    | 'services'
    | 'artist'
    | 'memories'
    | 'store'
    | 'news'
  data: Record<string, any> // JSONB field
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Backward compatibility aliases
export interface DatabaseSectionItem extends DatabaseSectionData {}

export interface DatabaseSectionSettings extends DatabaseSection {}

// Combined types for memories
export interface MemoriesDatabaseData extends DatabaseSectionData {
  section_type: 'memories'
  data: MemoriesItemData
}

export interface MemoriesDatabaseItem extends MemoriesDatabaseData {}

export interface MemoriesDatabaseSection extends DatabaseSection {
  section_type: 'memories'
}

export interface MemoriesDatabaseSettings extends MemoriesDatabaseSection {}

// Memories specific data structure (what goes in the data JSONB field)
export interface MemoriesItemData {
  url: string
  title: string
  description: string
  [key: string]: any // Allow additional fields
}

// Combined types for news
export interface NewsDatabaseData extends DatabaseSectionData {
  section_type: 'news'
  data: NewsItemData
}

export interface NewsDatabaseItem extends NewsDatabaseData {}

export interface NewsDatabaseSection extends DatabaseSection {
  section_type: 'news'
}

export interface NewsDatabaseSettings extends NewsDatabaseSection {}

// News specific data structure (what goes in the data JSONB field)
export interface NewsItemData {
  title: string
  subtitle?: string
  description: string
  image?: string
  date: string
  location?: string
  address?: string
  note?: string
  source?: string
  category: 'news' | 'feature' | 'interview' | 'exhibition' | 'biography'
  [key: string]: any // Allow additional fields
}

// Combined types for store
export interface StoreDatabaseData extends DatabaseSectionData {
  section_type: 'store'
  data: StoreItemData
}

export interface StoreDatabaseItem extends StoreDatabaseData {}

export interface StoreDatabaseSection extends DatabaseSection {
  section_type: 'store'
}

export interface StoreDatabaseSettings extends StoreDatabaseSection {}

// Store specific data structure (what goes in the data JSONB field)
export interface StoreItemData {
  title: string
  description: string
  price: number
  originalPrice?: number
  currency: string
  imageUrl: string
  images: string[]
  category: 'painting' | 'digital' | 'print' | 'sculpture'
  medium: string
  dimensions: {
    width: number
    height: number
    depth?: number
    unit: 'cm' | 'in'
  }
  year: number
  isOriginal: boolean
  isLimitedEdition: boolean
  editionSize?: number
  editionNumber?: number
  availability: 'available' | 'sold' | 'reserved'
  tags: string[]
  featured: boolean
  [key: string]: any // Allow additional fields
}

// Combined types for testimonials
export interface TestimonialDatabaseData extends DatabaseSectionData {
  section_type: 'testimonials'
  data: TestimonialItemData
}

export interface TestimonialDatabaseItem extends TestimonialDatabaseData {}

export interface TestimonialDatabaseSection extends DatabaseSection {
  section_type: 'testimonials'
}

export interface TestimonialDatabaseSettings
  extends TestimonialDatabaseSection {}

// Testimonial specific data structure (what goes in the data JSONB field)
export interface TestimonialItemData {
  name: string
  title: string
  company: string
  location: string
  quote: string
  avatar: string
  category:
    | 'artist'
    | 'businessman'
    | 'politician'
    | 'collector'
    | 'critic'
    | 'journalist'
    | 'curator'
  source: string
  [key: string]: any // Allow additional fields
}

// Combined types for workshop
export interface WorkshopDatabaseData extends DatabaseSectionData {
  section_type: 'workshop'
  data: WorkshopItemData
}

// Backward compatibility aliases
export interface WorkshopDatabaseItem extends WorkshopDatabaseData {}

export interface WorkshopDatabaseSection extends DatabaseSection {
  section_type: 'workshop'
}

export interface WorkshopDatabaseSettings extends WorkshopDatabaseSection {}

// Workshop specific data structure (what goes in the data JSONB field)
export interface WorkshopItemData {
  url: string
  title: string
  description: string
  [key: string]: any // Allow additional fields
}
