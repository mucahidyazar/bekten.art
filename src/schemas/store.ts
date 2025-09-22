import {z} from 'zod'

export type StoreItem = z.infer<typeof storeItemSchema>
export type StoreSettings = z.infer<typeof storeSettingsSchema>

// Default values
const defaultStoreItem: Partial<StoreItem> = {
  data: {
    title: '',
    description: '',
    price: 0,
    originalPrice: 0,
    currency: 'USD',
    imageUrl: '',
    images: [],
    category: 'painting' as const,
    medium: '',
    dimensions: {
      width: 0,
      height: 0,
      unit: 'cm',
    },
    year: new Date().getFullYear(),
    isOriginal: true,
    isLimitedEdition: false,
    availability: 'available',
    tags: [],
    featured: false,
  },
  order: 0,
  is_active: true,
}

const defaultStoreSettings: StoreSettings = {
  section_type: 'store',
  section_title: 'Art Store',
  section_description:
    'Discover and collect original artworks by Bekten Usubaliev. Each piece tells a story of Kyrgyz culture, contemporary expression, and artistic mastery.',
  badge_text: 'Store',
  max_items: 50,
  is_active: true,
  display_order: 4,
}

// Store item schema
const storeItemSchema = z.object({
  id: z.string().optional(),
  section_type: z.literal('store').default('store'),
  data: z
    .object({
      title: z
        .string()
        .min(1, 'Title is required')
        .max(100, 'Title must be less than 100 characters'),
      description: z
        .string()
        .max(1000, 'Description must be less than 1000 characters')
        .optional()
        .default(''),
      price: z.coerce.number().min(0, 'Price must be positive'),
      originalPrice: z.coerce
        .number()
        .min(0, 'Original price must be positive')
        .optional(),
      currency: z.string().default('USD'),
      imageUrl: z
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
      images: z
        .array(
          z
            .string()
            .refine(
              val =>
                val === '' ||
                val.startsWith('/') ||
                z.string().url().safeParse(val).success,
              'Image URL must be valid URL, relative path, or empty',
            ),
        )
        .default([]),
      category: z
        .enum([
          'painting',
          'digital',
          'print',
          'sculpture',
          'portrait',
          'landscape',
          'mixed-media',
        ])
        .default('painting'),
      medium: z
        .string()
        .max(100, 'Medium must be less than 100 characters')
        .optional()
        .default(''),
      dimensions: z.object({
        width: z.coerce.number().min(0, 'Width must be positive'),
        height: z.coerce.number().min(0, 'Height must be positive'),
        depth: z.coerce.number().min(0, 'Depth must be positive').optional(),
        unit: z.enum(['cm', 'in']).default('cm'),
      }),
      year: z.coerce
        .number()
        .int()
        .min(1900, 'Year must be at least 1900')
        .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
      isOriginal: z.boolean().default(true),
      isLimitedEdition: z.boolean().default(false),
      editionSize: z.coerce
        .number()
        .int()
        .min(1, 'Edition size must be at least 1')
        .optional(),
      editionNumber: z.coerce
        .number()
        .int()
        .min(1, 'Edition number must be at least 1')
        .optional(),
      availability: z
        .enum(['available', 'sold', 'reserved'])
        .default('available'),
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
    })
    .catchall(z.any())
    .default({
      title: '',
      description: '',
      price: 0,
      originalPrice: 0,
      currency: 'USD',
      imageUrl: '',
      images: [],
      category: 'painting' as const,
      medium: '',
      dimensions: {
        width: 0,
        height: 0,
        unit: 'cm',
      },
      year: new Date().getFullYear(),
      isOriginal: true,
      isLimitedEdition: false,
      availability: 'available',
      tags: [],
      featured: false,
    }),
  order: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().default(true),
})

// Store settings schema
const storeSettingsSchema = z.object({
  section_type: z.literal('store').default('store'),
  section_title: z
    .string()
    .min(1, 'Section title is required')
    .max(100, 'Title must be less than 100 characters'),
  section_description: z
    .string()
    .min(1, 'Section description is required')
    .max(500, 'Description must be less than 500 characters'),
  badge_text: z
    .string()
    .min(1, 'Badge text is required')
    .max(50, 'Badge text must be less than 50 characters'),
  max_items: z.number().int().min(1).max(100).default(50),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(4),
})

// Validation helpers
const validateStoreItem = (data: unknown): StoreItem => {
  return storeItemSchema.parse(data)
}

const validateStoreSettings = (data: unknown): StoreSettings => {
  return storeSettingsSchema.parse(data)
}

export {
  defaultStoreItem,
  defaultStoreSettings,
  storeItemSchema,
  storeSettingsSchema,
  validateStoreItem,
  validateStoreSettings,
}
