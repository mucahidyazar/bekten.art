import {z} from 'zod'

export type MemoriesItem = z.infer<typeof memoriesItemSchema>
export type MemoriesSettings = z.infer<typeof memoriesSettingsSchema>

// Default values
const defaultMemoriesItem: Partial<MemoriesItem> = {
  data: {
    url: '',
    title: '',
    description: '',
  },
  order: 0,
  is_active: true,
}

const defaultMemoriesSettings: MemoriesSettings = {
  section_type: 'memories',
  section_title: 'Memories in Paint',
  section_description:
    'A curated collection of artworks that capture emotions, dreams, and the essence of human experience through masterful brushstrokes',
  badge_text: 'Art Collection',
  max_items: 12,
  is_active: true,
  display_order: 2,
}

// Memories item schema
const memoriesItemSchema = z.object({
  id: z.string().optional(),
  section_type: z.literal('memories').default('memories'),
  data: z
    .object({
      url: z
        .string()
        .optional()
        .default('')
        .refine(
          val =>
            val === '' ||
            val.startsWith('/') ||
            z.string().url().safeParse(val).success,
          'Image URL must be a valid URL, relative path, or empty',
        ),
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
      url: '',
      title: '',
      description: '',
    }),
  order: z.number().int().min(0).optional(),
  is_active: z.boolean().default(true),
})

// Memories settings schema
const memoriesSettingsSchema = z.object({
  section_type: z.literal('memories').default('memories'),
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
  max_items: z.number().int().min(1).max(20).default(12),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(2),
})

// Validation helpers
const validateMemoriesItem = (data: unknown): MemoriesItem => {
  return memoriesItemSchema.parse(data)
}

const validateMemoriesSettings = (data: unknown): MemoriesSettings => {
  return memoriesSettingsSchema.parse(data)
}

export {
  defaultMemoriesItem,
  defaultMemoriesSettings,
  memoriesItemSchema,
  memoriesSettingsSchema,
  validateMemoriesItem,
  validateMemoriesSettings,
}
