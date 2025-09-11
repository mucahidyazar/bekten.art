import {z} from 'zod'

export type TestimonialItem = z.infer<typeof testimonialItemSchema>
export type TestimonialSettings = z.infer<typeof testimonialSettingsSchema>

// Default values
const defaultTestimonialItem: Partial<TestimonialItem> = {
  data: {
    name: '',
    title: '',
    company: '',
    location: '',
    quote: '',
    avatar: '',
    category: 'artist',
    source: '',
  },
  order: 0,
  is_active: true,
}

const defaultTestimonialSettings: TestimonialSettings = {
  section_type: 'testimonials',
  section_title: 'What People Say',
  section_description:
    "Hear from art enthusiasts, collectors, and fellow artists about their experience with Bekten Usubaliev's masterful work",
  badge_text: 'Testimonials',
  max_items: 10,
  is_active: true,
  display_order: 0,
}

// Testimonial item schema
const testimonialItemSchema = z.object({
  id: z.string().optional(),
  section_type: z.literal('testimonials').default('testimonials'),
  data: z
    .object({
      name: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name must be less than 100 characters'),
      title: z
        .string()
        .min(1, 'Title is required')
        .max(150, 'Title must be less than 150 characters'),
      company: z
        .string()
        .max(150, 'Company must be less than 150 characters')
        .default(''),
      location: z
        .string()
        .min(1, 'Location is required')
        .max(100, 'Location must be less than 100 characters'),
      quote: z
        .string()
        .min(10, 'Quote must be at least 10 characters')
        .max(1000, 'Quote must be less than 1000 characters'),
      avatar: z
        .string()
        .optional()
        .default('')
        .refine(
          val => val === '' || z.string().url().safeParse(val).success,
          'Avatar must be a valid URL or empty',
        ),
      category: z
        .enum([
          'artist',
          'businessman',
          'politician',
          'collector',
          'critic',
          'journalist',
          'curator',
        ])
        .default('artist'),
      source: z
        .string()
        .optional()
        .default('')
        .refine(
          val => val === '' || z.string().url().safeParse(val).success,
          'Source must be a valid URL or empty',
        ),
    })
    .catchall(z.any())
    .default({
      name: '',
      title: '',
      company: '',
      location: '',
      quote: '',
      avatar: '',
      category: 'artist',
      source: '',
    }),
  order: z.number().int().min(0).optional(),
  is_active: z.boolean().default(true),
})

// Testimonial settings schema
const testimonialSettingsSchema = z.object({
  section_type: z.literal('testimonials').default('testimonials'),
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
  max_items: z.number().int().min(1).max(20).default(10),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
})

// Validation helpers
const validateTestimonialItem = (data: unknown): TestimonialItem => {
  return testimonialItemSchema.parse(data)
}

const validateTestimonialSettings = (data: unknown): TestimonialSettings => {
  return testimonialSettingsSchema.parse(data)
}

export {
  defaultTestimonialItem,
  defaultTestimonialSettings,
  testimonialItemSchema,
  testimonialSettingsSchema,
  validateTestimonialItem,
  validateTestimonialSettings,
}
