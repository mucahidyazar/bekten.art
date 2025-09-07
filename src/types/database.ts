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
  data: Record<string, any> // JSONB field
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Backward compatibility aliases
export interface DatabaseSectionItem extends DatabaseSectionData {}

export interface DatabaseSectionSettings extends DatabaseSection {}

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
