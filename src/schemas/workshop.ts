import {z} from 'zod'

export type SectionItem = z.infer<typeof sectionItemSchema>

export type SectionSettings = z.infer<typeof sectionSettingsSchema>

// Type exports
export type SectionType = z.infer<typeof sectionTypeSchema>

export type WorkshopBulkUpdate = z.infer<typeof workshopBulkUpdateSchema>

export type WorkshopCollection = z.infer<typeof workshopCollectionSchema>

export type WorkshopCreateForm = z.infer<typeof workshopCreateFormSchema>

export type WorkshopEditForm = z.infer<typeof workshopEditFormSchema>

// Workshop-specific types (backward compatibility)
export type WorkshopItem = z.infer<typeof workshopItemSchema>

export type WorkshopSettings = z.infer<typeof workshopSettingsSchema>

// Default values
const defaultWorkshopItem: Partial<WorkshopItem> = {
  data: {
    url: '',
    title: '',
    description: '',
  },
  order: 0,
  is_active: true,
}

const defaultWorkshopSettings: WorkshopSettings = {
  section_type: 'workshop',
  section_title: 'The Creative Workshop',
  section_description:
    'Step into the creative sanctuary where masterpieces come to life, where tradition meets innovation',
  badge_text: 'Behind the Art',
  max_items: 6,
  is_active: true,
  display_order: 0,
}

// Section types enum - MUST be first
const sectionTypeSchema = z.enum([
  'workshop',
  'gallery',
  'portfolio',
  'testimonials',
  'services',
])

// Single section item schema (formerly workshop item)
const sectionItemSchema = z.object({
  id: z.string().optional(),
  section_type: sectionTypeSchema.default('workshop'),
  data: z
    .object({
      url: z.string().optional().default(''),
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

// Workshop item schema (backward compatibility)
const workshopItemSchema = sectionItemSchema.extend({
  section_type: z.literal('workshop').default('workshop'),
})

// Section settings schema (generic for all section types)
const sectionSettingsSchema = z.object({
  section_type: sectionTypeSchema.default('workshop'),
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

const validateWorkshopCollection = (data: unknown): WorkshopCollection => {
  return workshopCollectionSchema.parse(data)
}

const validateWorkshopEditForm = (data: unknown): WorkshopEditForm => {
  return workshopEditFormSchema.parse(data)
}

// Validation helpers
const validateWorkshopItem = (data: unknown): WorkshopItem => {
  return workshopItemSchema.parse(data)
}

// Workshop bulk update schema
const workshopBulkUpdateSchema = z.object({
  items: z.array(
    workshopItemSchema.extend({
      id: z.string().min(1, 'Item ID is required'),
    }),
  ),
})

// Workshop collection schema
const workshopCollectionSchema = z.object({
  items: z
    .array(workshopItemSchema)
    .min(1, 'At least one workshop item is required'),
  title: z
    .string()
    .min(1, 'Collection title is required')
    .max(100, 'Title must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .max(300, 'Description must be less than 300 characters')
    .optional(),
  is_active: z.boolean().default(true),
})

// Workshop edit form schema (for single item)
const workshopEditFormSchema = z.object({
  data: z
    .object({
      url: z.string().optional().default(''),
      title: z
        .string()
        .min(1, 'Title is required')
        .max(100, 'Title must be less than 100 characters'),
      description: z
        .string()
        .min(1, 'Description is required')
        .max(500, 'Description must be less than 500 characters'),
    })
    .catchall(z.any()),
})

// Workshop create form schema
const workshopCreateFormSchema = workshopEditFormSchema.extend({
  order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
})

// Workshop settings schema (backward compatibility)
const workshopSettingsSchema = sectionSettingsSchema.extend({
  section_type: z.literal('workshop').default('workshop'),
})

export {
  defaultWorkshopItem,
  defaultWorkshopSettings,
  sectionItemSchema,
  sectionSettingsSchema,
  sectionTypeSchema,
  validateWorkshopCollection,
  validateWorkshopEditForm,
  validateWorkshopItem,
  workshopBulkUpdateSchema,
  workshopCollectionSchema,
  workshopCreateFormSchema,
  workshopEditFormSchema,
  workshopItemSchema,
  workshopSettingsSchema,
}
