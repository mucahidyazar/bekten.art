import {z} from 'zod'

export type ArtistItem = z.infer<typeof artistItemSchema>
export type ArtistSettings = z.infer<typeof artistSettingsSchema>

// Default values
const defaultArtistItem: Partial<ArtistItem> = {
  data: {
    number: '',
    title: '',
    description: '',
  },
  order: 0,
  is_active: true,
}

const defaultArtistSettings: ArtistSettings = {
  section_type: 'artist',
  section_title: 'Master Kyrgyz Artist',
  section_description:
    'Bekten Usubaliev - Unveiling the hidden emotions and dreams within the human spirit through masterful brushstrokes',
  badge_text: 'About the Artist',
  max_items: 6,
  is_active: true,
  display_order: 0,
}

// Artist item schema
const artistItemSchema = z.object({
  id: z.string().optional(),
  section_type: z.literal('artist').default('artist'),
  data: z
    .object({
      number: z
        .string()
        .min(1, 'Number is required')
        .max(20, 'Number must be less than 20 characters'),
      title: z
        .string()
        .min(1, 'Title is required')
        .max(100, 'Title must be less than 100 characters'),
      description: z
        .string()
        .min(1, 'Description is required')
        .max(500, 'Description must be less than 500 characters'),
    })
    .catchall(z.any())
    .default({
      number: '',
      title: '',
      description: '',
    }),
  order: z.number().int().min(0).optional(),
  is_active: z.boolean().default(true),
})

// Artist settings schema
const artistSettingsSchema = z.object({
  section_type: z.literal('artist').default('artist'),
  section_title: z
    .string()
    .min(1, 'Section title is required')
    .max(100, 'Title must be less than 100 characters'),
  section_description: z
    .string()
    .min(1, 'Section description is required')
    .max(300, 'Description must be less than 300 characters'),
  badge_text: z
    .string()
    .min(1, 'Badge text is required')
    .max(50, 'Badge text must be less than 50 characters'),
  max_items: z.number().int().min(1).max(20).default(6),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
})

// Validation helpers
const validateArtistItem = (data: unknown): ArtistItem => {
  return artistItemSchema.parse(data)
}

const validateArtistSettings = (data: unknown): ArtistSettings => {
  return artistSettingsSchema.parse(data)
}

export {
  artistItemSchema,
  artistSettingsSchema,
  defaultArtistItem,
  defaultArtistSettings,
  validateArtistItem,
  validateArtistSettings,
}
