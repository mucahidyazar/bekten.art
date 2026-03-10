'use server'

import {revalidatePath} from 'next/cache'

import {z} from 'zod'

import {newsItemSchema, newsSettingsSchema} from '@/schemas/news'
import {createServerAction} from '@/utils/create-server-action'
import {createClient, getUser} from '@/utils/supabase/server'

// Helper function to validate UUID
const isValidUUID = (id: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  return uuidRegex.test(id)
}

// Schema for news item operations
const newsItemOperationSchema = z.object({
  id: z.string().min(1, 'Item ID is required'),
})

const newsItemUpdateSchema = newsItemSchema.extend({
  id: z.string().min(1, 'Item ID is required'),
})

const newsDataSaveSchema = z.object({
  items: z.array(newsItemSchema),
  settings: newsSettingsSchema,
})

// Create single news item
export const createNewsItemAction = createServerAction(
  newsItemSchema.omit({id: true}),
  async ({input}) => {
    const user = await getUser()

    if (!user?.isAdmin) {
      throw new Error('Admin access required')
    }
    const supabase = await createClient()

    // Store all data in the data field
    const combinedData = {
      ...input.data,
    }

    const {data, error} = await supabase
      .from('section_data')
      .insert([
        {
          data: combinedData,
          order: input.order || 0,
          is_active: input.is_active,
          section_type: 'news',
        },
      ])
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Revalidate the page
    revalidatePath('/news')
    revalidatePath('/[locale]/news', 'page')

    return {
      success: true,
      message: 'News item created successfully',
      data,
    }
  },
)

// Delete single news item
export const deleteNewsItemAction = createServerAction(
  newsItemOperationSchema,
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

    // Delete news item
    const {error} = await supabase
      .from('section_data')
      .delete()
      .eq('id', id)
      .eq('section_type', 'news')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Revalidate the page
    revalidatePath('/news')
    revalidatePath('/[locale]/news', 'page')

    return {
      success: true,
      message: 'News item deleted successfully',
    }
  },
)

// Get news data
export const getNewsDataAction = createServerAction(z.object({}), async () => {
  const user = await getUser()

  if (!user?.isAdmin) {
    throw new Error('Admin access required')
  }
  const supabase = await createClient()

  // Get news data from database
  const {data: newsData, error: newsError} = await supabase
    .from('section_data')
    .select('*')
    .eq('section_type', 'news')
    .order('order', {ascending: true})

  // Get news settings
  const {data: settingsData, error: settingsError} = await supabase
    .from('sections')
    .select('*')
    .eq('section_type', 'news')
    .single()

  if (newsError && newsError.code !== 'PGRST116') {
    console.error('News data error:', newsError)

    return {items: [], settings: null}
  }

  if (settingsError && settingsError.code !== 'PGRST116') {
    console.error('News settings error:', settingsError)

    return {
      items: newsData || [],
      settings: null,
    }
  }

  return {
    items: newsData || [],
    settings: settingsData || null,
  }
})

// Save news data (bulk update/create for items and settings)
export const saveNewsDataAction = createServerAction(
  newsDataSaveSchema,
  async ({input}) => {
    try {
      console.log('saveNewsDataAction called with input:', input)
      console.log('Input items:', input.items)
      console.log('Input settings:', input.settings)

      const user = await getUser()

      if (!user?.isAdmin) {
        throw new Error('Admin access required')
      }
      const supabase = await createClient()
      const {items, settings} = input

      console.log('Admin access confirmed, proceeding with save...')

      // Get existing news items
      const {data: existingItems, error: fetchError} = await supabase
        .from('section_data')
        .select('*')
        .eq('section_type', 'news')

      if (fetchError) {
        console.error('Fetch error:', fetchError)
        throw new Error(`Failed to fetch existing items: ${fetchError.message}`)
      }

      // Process items safely - update existing, insert new, delete removed
      const existingIds = new Set<string>(
        existingItems?.map((item: {id: string}) => item.id) || [],
      )
      const newIds = new Set<string>(
        items
          .map(item => item.id)
          .filter(
            (id): id is string =>
              typeof id === 'string' &&
              isValidUUID(id) &&
              !id.startsWith('temp-'),
          ),
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
          section_type: 'news',
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
            .eq('section_type', 'news')

          if (updateError) {
            console.error(`Update error for item ${item.id}:`, updateError)
            throw new Error(
              `Failed to update item ${item.id}: ${updateError.message}`,
            )
          }
        } else {
          // Insert new item
          console.log('Inserting new item:', item)
          const {error: insertError} = await supabase
            .from('section_data')
            .insert([itemData])

          if (insertError) {
            console.error('Insert error:', insertError)
            throw new Error(`Failed to insert new item: ${insertError.message}`)
          }
        }
      }

      // Delete items that are no longer in the new list
      const idsToDelete = Array.from(existingIds).filter(id => !newIds.has(id))

      if (idsToDelete.length > 0) {
        console.log('Deleting removed items:', idsToDelete)
        const {error: deleteError} = await supabase
          .from('section_data')
          .delete()
          .in('id', idsToDelete)
          .eq('section_type', 'news')

        if (deleteError) {
          console.error('Delete error:', deleteError)
          throw new Error(`Failed to delete items: ${deleteError.message}`)
        }
      }

      // Update settings
      const settingsToUpsert = {
        section_type: settings.section_type,
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
      revalidatePath('/news')
      revalidatePath('/[locale]/news', 'page')

      console.log('Revalidation completed')

      return {
        success: true,
        message: 'News data updated successfully',
      }
    } catch (error) {
      console.error('saveNewsDataAction error:', error)
      throw error
    }
  },
)

// Update single news item
export const updateNewsItemAction = createServerAction(
  newsItemUpdateSchema,
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

    // Update news item
    // Store all data in the data field
    const combinedData = {
      ...updateData.data,
    }

    const {data, error} = await supabase
      .from('section_data')
      .update({
        data: combinedData,
        is_active: updateData.is_active,
        section_type: 'news',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('section_type', 'news')
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Revalidate the page
    revalidatePath('/news')
    revalidatePath('/[locale]/news', 'page')

    return {
      success: true,
      message: 'News item updated successfully',
      data,
    }
  },
)
