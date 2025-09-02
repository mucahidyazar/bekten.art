import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface ContactInfo {
  phone: string
  email: string
  address: string
  instagram_url: string
  working_hours: string
  map_embed_url: string
  created_at?: string
  updated_at?: string
}

const CONTACT_INFO_QUERY_KEY = ['contact-info'] as const

// Fetch contact info
const fetchContactInfo = async (): Promise<ContactInfo> => {
  const response = await fetch('/api/cms/contact-info', {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch contact info')
  }

  const data = await response.json()

  // Return default values if no data exists
  return {
    phone: data.contactInfo?.phone || '',
    email: data.contactInfo?.email || '',
    address: data.contactInfo?.address || '',
    instagram_url: data.contactInfo?.instagram_url || '',
    working_hours: data.contactInfo?.working_hours || '',
    map_embed_url: data.contactInfo?.map_embed_url || '',
  }
}

// Save contact info
const saveContactInfo = async (contactInfo: ContactInfo): Promise<void> => {
  const response = await fetch('/api/cms/contact-info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(contactInfo),
  })

  if (!response.ok) {
    throw new Error('Failed to save contact info')
  }
}

// Hook to fetch contact info
export const useContactInfo = (initialData?: ContactInfo | null) => {
  return useQuery({
    queryKey: CONTACT_INFO_QUERY_KEY,
    queryFn: fetchContactInfo,
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialData: initialData ? {
      phone: initialData.phone || '',
      email: initialData.email || '',
      address: initialData.address || '',
      instagram_url: initialData.instagram_url || '',
      working_hours: initialData.working_hours || '',
      map_embed_url: initialData.map_embed_url || '',
    } : undefined,
  })
}

// Hook to save contact info
export const useSaveContactInfo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveContactInfo,
    onSuccess: () => {
      // Invalidate and refetch contact info after successful save
      queryClient.invalidateQueries({
        queryKey: CONTACT_INFO_QUERY_KEY,
      })
    },
  })
}
