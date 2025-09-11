'use server'

import {revalidatePath} from 'next/cache'

import {z} from 'zod'

import {
  testimonialItemSchema,
  testimonialSettingsSchema,
} from '@/schemas/testimonial'
import {createServerAction} from '@/utils/create-server-action'
import {createClient, getUser} from '@/utils/supabase/server'
import {isValidUUID} from '@/utils/validation'

// Schema for testimonial data save
const testimonialSaveSchema = z.object({
  items: z.array(testimonialItemSchema),
  settings: testimonialSettingsSchema,
})

// Schema for testimonial item operations
const testimonialItemOperationSchema = z.object({
  id: z.string().min(1, 'Item ID is required'),
})

const testimonialItemUpdateSchema = testimonialItemSchema.extend({
  id: z.string().min(1, 'Item ID is required'),
})

// Create new testimonial item
export const createTestimonialItemAction = createServerAction(
  testimonialItemSchema,
  async ({input}) => {
    const user = await getUser()

    if (!user?.isAdmin) {
      throw new Error('Admin access required')
    }
    const supabase = await createClient()

    // Get current max order
    const {data: maxOrderData} = await supabase
      .from('section_data')
      .select('order')
      .eq('section_type', 'testimonials')
      .order('order', {ascending: false})
      .limit(1)
      .single()

    const nextOrder = (maxOrderData?.order || 0) + 1

    // Insert new testimonial item
    // Store all data in the data field
    const combinedData = {
      ...input.data,
    }

    // Let database generate UUID automatically - don't include id field
    const insertData = {
      data: combinedData,
      is_active: input.is_active,
      section_type: 'testimonials',
      order: nextOrder,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const {data, error} = await supabase
      .from('section_data')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Revalidate the page
    revalidatePath('/')
    revalidatePath('/[locale]', 'page')

    return {
      success: true,
      data,
      message: 'Testimonial item created successfully',
    }
  },
)

// Delete testimonial item
export const deleteTestimonialItemAction = createServerAction(
  testimonialItemOperationSchema,
  async ({input}) => {
    const user = await getUser()

    if (!user?.isAdmin) {
      throw new Error('Admin access required')
    }
    const supabase = await createClient()
    const {id} = input

    // Validate ID format
    if (!isValidUUID(id)) {
      throw new Error('Invalid ID format - must be a valid UUID')
    }

    // Delete testimonial item
    const {error} = await supabase
      .from('section_data')
      .delete()
      .eq('id', id)
      .eq('section_type', 'testimonials')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Revalidate the page
    revalidatePath('/')
    revalidatePath('/[locale]', 'page')

    return {
      success: true,
      message: 'Testimonial item deleted successfully',
    }
  },
)

// Get testimonial data
export const getTestimonialDataAction = createServerAction(
  z.object({}),
  async () => {
    const user = await getUser()

    if (!user?.isAdmin) {
      throw new Error('Admin access required')
    }
    const supabase = await createClient()

    // Get testimonial data from database
    const {data: testimonialData, error: testimonialError} = await supabase
      .from('section_data')
      .select('*')
      .eq('section_type', 'testimonials')
      .order('order', {ascending: true})

    // Get testimonial settings
    const {data: settingsData, error: settingsError} = await supabase
      .from('sections')
      .select('*')
      .eq('section_type', 'testimonials')
      .single()

    if (testimonialError && testimonialError.code !== 'PGRST116') {
      throw new Error(`Database error: ${testimonialError.message}`)
    }

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw new Error(`Settings error: ${settingsError.message}`)
    }

    return {
      items: testimonialData || [],
      settings: settingsData || null,
    }
  },
)

// Save testimonial data (bulk update)
export const saveTestimonialDataAction = createServerAction(
  testimonialSaveSchema,
  async ({input}) => {
    try {
      console.log('saveTestimonialDataAction called with input:', input)
      console.log('Input items:', input.items)
      console.log('Input settings:', input.settings)

      const user = await getUser()

      if (!user?.isAdmin) {
        throw new Error('Admin access required')
      }
      const supabase = await createClient()
      const {items, settings} = input

      console.log('Admin access confirmed, proceeding with save...')

      // Get existing testimonial items
      const {data: existingItems, error: fetchError} = await supabase
        .from('section_data')
        .select('*')
        .eq('section_type', 'testimonials')

      if (fetchError) {
        console.error('Fetch error:', fetchError)
        throw new Error(`Failed to fetch existing items: ${fetchError.message}`)
      }

      // Process items safely - update existing, insert new, delete removed
      const existingIds = new Set(existingItems?.map(item => item.id) || [])
      const newIds = new Set(
        items
          .map(item => item.id)
          .filter(id => id && isValidUUID(id) && !id.startsWith('temp-')),
      )

      // Update or insert items
      for (let index = 0; index < items.length; index++) {
        const item = items[index]
        const combinedData = {
          ...item.data,
        }

        const itemData = {
          data: combinedData,
          order: index,
          is_active: item.is_active,
          section_type: 'testimonials',
          updated_at: new Date().toISOString(),
        }

        // If item has valid UUID and exists, update it
        if (
          item.id &&
          isValidUUID(item.id) &&
          !item.id.startsWith('temp-') &&
          existingIds.has(item.id)
        ) {
          console.log(`Updating existing item: ${item.id}`)
          const {error: updateError} = await supabase
            .from('section_data')
            .update(itemData)
            .eq('id', item.id)
            .eq('section_type', 'testimonials')

          if (updateError) {
            console.error('Update error:', updateError)
            throw new Error(
              `Failed to update item ${item.id}: ${updateError.message}`,
            )
          }
        } else {
          // Insert new item (let database generate UUID)
          console.log('Inserting new item')
          const insertData = {
            ...itemData,
            created_at: new Date().toISOString(),
          }

          const {error: insertError} = await supabase
            .from('section_data')
            .insert(insertData)

          if (insertError) {
            console.error('Insert error:', insertError)
            throw new Error(`Failed to insert new item: ${insertError.message}`)
          }
        }
      }

      // Delete items that are no longer in the list (only if we have valid IDs to compare)
      if (newIds.size > 0) {
        const idsToDelete = Array.from(existingIds).filter(
          id => !newIds.has(id),
        )

        if (idsToDelete.length > 0) {
          console.log(`Deleting removed items: ${idsToDelete.join(', ')}`)
          const {error: deleteError} = await supabase
            .from('section_data')
            .delete()
            .eq('section_type', 'testimonials')
            .in('id', idsToDelete)

          if (deleteError) {
            console.error('Delete error:', deleteError)
            throw new Error(
              `Failed to delete removed items: ${deleteError.message}`,
            )
          }
        }
      }

      // Upsert testimonial settings
      console.log('Upserting testimonial settings...')
      const settingsToUpsert = {
        section_type: 'testimonials',
        section_title: settings.section_title,
        section_description: settings.section_description,
        badge_text: settings.badge_text,
        max_items: settings.max_items,
        is_active: settings.is_active,
        display_order: settings.display_order,
        updated_at: new Date().toISOString(),
      }

      console.log('Settings to upsert:', settingsToUpsert)

      const {error: settingsError} = await supabase
        .from('sections')
        .upsert(settingsToUpsert, {
          onConflict: 'section_type',
        })

      if (settingsError) {
        console.error('Settings error:', settingsError)
        throw new Error(`Failed to update settings: ${settingsError.message}`)
      }

      console.log('All database operations completed successfully')

      // Revalidate the page to show updated data
      revalidatePath('/')
      revalidatePath('/[locale]', 'page')

      console.log('Revalidation completed')

      return {
        success: true,
        message: 'Testimonial data updated successfully',
      }
    } catch (error) {
      console.error('saveTestimonialDataAction error:', error)
      throw error
    }
  },
)

// Update single testimonial item
export const updateTestimonialItemAction = createServerAction(
  testimonialItemUpdateSchema,
  async ({input}) => {
    const user = await getUser()

    if (!user?.isAdmin) {
      throw new Error('Admin access required')
    }
    const supabase = await createClient()
    const {id, ...updateData} = input

    // Validate ID format
    if (!isValidUUID(id)) {
      throw new Error('Invalid ID format - must be a valid UUID')
    }

    // Update testimonial item
    // Store all data in the data field
    const combinedData = {
      ...updateData.data,
    }

    const {data, error} = await supabase
      .from('section_data')
      .update({
        data: combinedData,
        is_active: updateData.is_active,
        section_type: 'testimonials',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('section_type', 'testimonials')
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Revalidate the page
    revalidatePath('/')
    revalidatePath('/[locale]', 'page')

    return {
      success: true,
      data,
      message: 'Testimonial item updated successfully',
    }
  },
)
