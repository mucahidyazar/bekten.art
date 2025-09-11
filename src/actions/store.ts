'use server'

import {revalidatePath} from 'next/cache'

import {z} from 'zod'

import {storeItemSchema, storeSettingsSchema} from '@/schemas/store'
import {createServerAction} from '@/utils/create-server-action'
import {createClient, getUser} from '@/utils/supabase/server'
import {isValidUUID} from '@/utils/validation'

// Schema for store data save
const storeSaveSchema = z.object({
  items: z.array(storeItemSchema),
  settings: storeSettingsSchema,
})

// Schema for store item operations
const storeItemOperationSchema = z.object({
  id: z.string().min(1, 'Item ID is required'),
})

const storeItemUpdateSchema = storeItemSchema.extend({
  id: z.string().min(1, 'Item ID is required'),
})

// Create new store item
export const createStoreItemAction = createServerAction(
  storeItemSchema,
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
      .eq('section_type', 'store')
      .order('order', {ascending: false})
      .limit(1)
      .single()

    const nextOrder = (maxOrderData?.order || 0) + 1

    // Insert new store item
    // Store all data in the data field
    const combinedData = {
      ...input.data,
    }

    // Let database generate UUID automatically - don't include id field
    const insertData = {
      data: combinedData,
      is_active: input.is_active,
      section_type: 'store',
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
    revalidatePath('/store')
    revalidatePath('/[locale]/store', 'page')

    return {
      success: true,
      data,
      message: 'Store item created successfully',
    }
  },
)

// Delete store item
export const deleteStoreItemAction = createServerAction(
  storeItemOperationSchema,
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

    // Delete store item
    const {error} = await supabase
      .from('section_data')
      .delete()
      .eq('id', id)
      .eq('section_type', 'store')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Revalidate the page
    revalidatePath('/store')
    revalidatePath('/[locale]/store', 'page')

    return {
      success: true,
      message: 'Store item deleted successfully',
    }
  },
)

// Get store data
export const getStoreDataAction = createServerAction(z.object({}), async () => {
  const supabase = await createClient()

  // Get store data from database
  const {data: storeData, error: storeError} = await supabase
    .from('section_data')
    .select('*')
    .eq('section_type', 'store')
    .eq('is_active', true)
    .order('order', {ascending: true})

  // Get store settings
  const {data: settingsData, error: settingsError} = await supabase
    .from('sections')
    .select('*')
    .eq('section_type', 'store')
    .eq('is_active', true)
    .single()

  if (storeError && storeError.code !== 'PGRST116') {
    console.error('Store data error:', storeError)

    return {items: [], settings: null}
  }

  if (settingsError && settingsError.code !== 'PGRST116') {
    console.error('Store settings error:', settingsError)

    return {
      items: storeData || [],
      settings: null,
    }
  }

  return {
    items: storeData || [],
    settings: settingsData || null,
  }
})

// Get store data for admin
export const getStoreDataAdminAction = createServerAction(
  z.object({}),
  async () => {
    const user = await getUser()

    if (!user?.isAdmin) {
      throw new Error('Admin access required')
    }
    const supabase = await createClient()

    // Get store data from database
    const {data: storeData, error: storeError} = await supabase
      .from('section_data')
      .select('*')
      .eq('section_type', 'store')
      .order('order', {ascending: true})

    // Get store settings
    const {data: settingsData, error: settingsError} = await supabase
      .from('sections')
      .select('*')
      .eq('section_type', 'store')
      .single()

    if (storeError && storeError.code !== 'PGRST116') {
      throw new Error(`Database error: ${storeError.message}`)
    }

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw new Error(`Settings error: ${settingsError.message}`)
    }

    return {
      items: storeData || [],
      settings: settingsData || null,
    }
  },
)

// Save store data (bulk update)
export const saveStoreDataAction = createServerAction(
  storeSaveSchema,
  async ({input}) => {
    try {
      console.log('saveStoreDataAction called with input:', input)
      console.log('Input items:', input.items)
      console.log('Input settings:', input.settings)

      const user = await getUser()

      if (!user?.isAdmin) {
        throw new Error('Admin access required')
      }
      const supabase = await createClient()
      const {items, settings} = input

      console.log('Admin access confirmed, proceeding with save...')

      // Get existing store items
      const {data: existingItems, error: fetchError} = await supabase
        .from('section_data')
        .select('*')
        .eq('section_type', 'store')

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
          section_type: 'store',
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
            .eq('section_type', 'store')

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
            .eq('section_type', 'store')
            .in('id', idsToDelete)

          if (deleteError) {
            console.error('Delete error:', deleteError)
            throw new Error(
              `Failed to delete removed items: ${deleteError.message}`,
            )
          }
        }
      }

      // Upsert store settings
      console.log('Upserting store settings...')
      const settingsToUpsert = {
        section_type: 'store',
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
      revalidatePath('/store')
      revalidatePath('/[locale]/store', 'page')

      console.log('Revalidation completed')

      return {
        success: true,
        message: 'Store data updated successfully',
      }
    } catch (error) {
      console.error('saveStoreDataAction error:', error)
      throw error
    }
  },
)

// Update single store item
export const updateStoreItemAction = createServerAction(
  storeItemUpdateSchema,
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

    // Update store item
    // Store all data in the data field
    const combinedData = {
      ...updateData.data,
    }

    const {data, error} = await supabase
      .from('section_data')
      .update({
        data: combinedData,
        is_active: updateData.is_active,
        section_type: 'store',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('section_type', 'store')
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Revalidate the page
    revalidatePath('/store')
    revalidatePath('/[locale]/store', 'page')

    return {
      success: true,
      data,
      message: 'Store item updated successfully',
    }
  },
)
