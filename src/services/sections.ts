import {createClient} from '@/utils/supabase/server'

import type {
  DatabaseSectionItem,
  DatabaseSectionSettings,
} from '@/types/database'

export type SectionType =
  | 'workshop'
  | 'artist'
  | 'gallery'
  | 'portfolio'
  | 'testimonials'
  | 'services'

export async function getSectionData(sectionType: SectionType): Promise<{
  items: DatabaseSectionItem[]
  settings: DatabaseSectionSettings | null
}> {
  const supabase = await createClient()

  try {
    // Get section data from database
    const {data: sectionData, error: dataError} = await supabase
      .from('section_data')
      .select('*')
      .eq('section_type', sectionType)
      .eq('is_active', true)
      .order('order', {ascending: true})

    // Get section settings
    const {data: sectionSettings, error: settingsError} = await supabase
      .from('sections')
      .select('*')
      .eq('section_type', sectionType)
      .eq('is_active', true)
      .single()

    if (dataError && dataError.code !== 'PGRST116') {
      console.error(`Error fetching ${sectionType} data:`, dataError)

      return {items: [], settings: null}
    }

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error(`Error fetching ${sectionType} settings:`, settingsError)

      return {
        items: (sectionData || []) as DatabaseSectionItem[],
        settings: null,
      }
    }

    return {
      items: (sectionData || []) as DatabaseSectionItem[],
      settings: sectionSettings as DatabaseSectionSettings | null,
    }
  } catch (error) {
    console.error(`Error in getSectionData for ${sectionType}:`, error)

    return {items: [], settings: null}
  }
}
