'use server'

import { createClient } from '@/utils/supabase/server'

export interface ContactInfo {
  phone: string
  email: string
  address: string
  instagram_url: string
  working_hours: string
  map_embed_url: string
}

export async function getContactInfo(): Promise<ContactInfo | null> {
  try {
    const supabase = await createClient()

    const { data: contactInfo, error } = await supabase
      .from('cms_contact_info')
      .select('*')
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new Error('Failed to fetch contact information')
    }

    return contactInfo
  } catch (error) {
    console.error('Failed to fetch contact info:', error)
    return null
  }
}
