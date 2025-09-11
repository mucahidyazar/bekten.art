import {z} from 'zod'

// Type definitions
export type NewsItem = z.infer<typeof newsItemSchema>
export type NewsSettings = z.infer<typeof newsSettingsSchema>

// Default news item
const defaultNewsItem: NewsItem = {
  id: '',
  section_type: 'news',
  data: {
    title: '',
    subtitle: '',
    description: '',
    image: '',
    date: '',
    location: '',
    address: '',
    note: '',
    source: '',
    category: 'news',
  },
  order: 0,
  is_active: true,
}

const defaultNewsSettings: NewsSettings = {
  section_type: 'news',
  section_title: 'All News & Events',
  section_description:
    "Stay updated with the latest news, exhibitions, workshops, and events featuring Bekten Usubaliev's artistic journey",
  badge_text: 'News & Events',
  max_items: 20,
  is_active: true,
  display_order: 6,
}

// News item schema
const newsItemSchema = z.object({
  id: z.string().optional(),
  section_type: z.literal('news').default('news'),
  data: z
    .object({
      title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title must be less than 200 characters'),
      subtitle: z
        .string()
        .max(300, 'Subtitle must be less than 300 characters')
        .optional()
        .default(''),
      description: z
        .string()
        .min(1, 'Description is required')
        .max(2000, 'Description must be less than 2000 characters'),
      image: z
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
      date: z.string().min(1, 'Date is required'),
      location: z
        .string()
        .max(200, 'Location must be less than 200 characters')
        .optional()
        .default(''),
      address: z
        .string()
        .max(300, 'Address must be less than 300 characters')
        .optional()
        .default(''),
      note: z
        .string()
        .max(500, 'Note must be less than 500 characters')
        .optional()
        .default(''),
      source: z
        .string()
        .optional()
        .default('')
        .refine(
          val =>
            val === '' ||
            val.startsWith('/') ||
            z.string().url().safeParse(val).success,
          'Source URL must be a valid URL, relative path, or empty',
        ),
      category: z
        .enum(['news', 'feature', 'interview', 'exhibition', 'biography'])
        .default('news'),
    })
    .catchall(z.any())
    .default({
      title: '',
      subtitle: '',
      description: '',
      image: '',
      date: '',
      location: '',
      address: '',
      note: '',
      source: '',
      category: 'news',
    }),
  order: z.number().int().min(0).optional(),
  is_active: z.boolean().default(true),
})

// News settings schema
const newsSettingsSchema = z.object({
  section_type: z.literal('news').default('news'),
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
  max_items: z.number().int().min(1).max(50).default(20),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(6),
})

// Validation helpers
const validateNewsItem = (data: unknown): NewsItem => {
  return newsItemSchema.parse(data)
}

const validateNewsSettings = (data: unknown): NewsSettings => {
  return newsSettingsSchema.parse(data)
}

export {
  defaultNewsItem,
  defaultNewsSettings,
  newsItemSchema,
  newsSettingsSchema,
  validateNewsItem,
  validateNewsSettings,
}
