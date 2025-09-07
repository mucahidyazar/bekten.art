import { NextRequest, NextResponse } from 'next/server'

import {
  workshopCollectionSchema,
  workshopSettingsSchema,
} from '@/schemas/workshop'
import { createClient } from '@/utils/supabase/server'

// DELETE - Delete workshop item
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || userData?.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get item ID from URL
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    // Delete workshop item
    const { error } = await supabase
      .from('section_items')
      .delete()
      .eq('id', id)
      .eq('section_type', 'workshop')

    if (error) {
      console.error('Error deleting workshop item:', error)

      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Workshop item deleted successfully'
    })

  } catch (error) {
    console.error('Workshop API DELETE error:', error)

    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET - Load workshop data
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || userData?.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get workshop data from database
    const { data: workshopData, error: workshopError } = await supabase
      .from('section_items')
      .select('*')
      .eq('section_type', 'workshop')
      .order('order', { ascending: true })

    // Get workshop settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('section_settings')
      .select('*')
      .eq('section_type', 'workshop')
      .single()

    if (workshopError && workshopError.code !== 'PGRST116') {
      console.error('Error loading workshop data:', workshopError)

      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error loading workshop settings:', settingsError)

      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      items: workshopData || [],
      settings: settingsData || {
        sectionTitle: 'The Creative Workshop',
        sectionDescription: 'Step into the creative sanctuary where masterpieces come to life, where tradition meets innovation',
        badgeText: 'Behind the Art',
        isVisible: true,
        maxItems: 5,
      }
    })
  } catch (error) {
    console.error('Workshop API GET error:', error)

    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Save workshop data
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || userData?.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { items, settings } = body

    // Validate data
    const validatedItems = workshopCollectionSchema.parse({ items }).items
    const validatedSettings = workshopSettingsSchema.parse(settings)

    // Start transaction
    const { error: transactionError } = await supabase.rpc('begin_transaction')

    if (transactionError) {
      throw new Error('Failed to start transaction')
    }

    try {
      // Delete existing workshop items
      const { error: deleteError } = await supabase
        .from('section_items')
        .delete()
        .eq('section_type', 'workshop')

      if (deleteError) {
        throw deleteError
      }

      // Insert new workshop items
      if (validatedItems.length > 0) {
        const itemsToInsert = validatedItems.map((item, index) => ({
          ...item,
          id: item.id?.startsWith('temp-') ? undefined : item.id, // Remove temp IDs
          order: index,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        const { error: insertError } = await supabase
          .from('section_items')
          .insert(itemsToInsert.map(item => ({
            ...item,
            section_type: 'workshop'
          })))

        if (insertError) {
          throw insertError
        }
      }

      // Upsert workshop settings
      const { error: settingsError } = await supabase
        .from('section_settings')
        .upsert({
          id: 1, // Single settings record
          ...validatedSettings,
          updated_at: new Date().toISOString(),
        })

      if (settingsError) {
        throw settingsError
      }

      // Commit transaction
      const { error: commitError } = await supabase.rpc('commit_transaction')

      if (commitError) {
        throw commitError
      }

      return NextResponse.json({
        success: true,
        message: 'Workshop data updated successfully'
      })

    } catch (error) {
      // Rollback transaction
      await supabase.rpc('rollback_transaction')
      throw error
    }

  } catch (error) {
    console.error('Workshop API POST error:', error)

    if (error instanceof Error) {
      return NextResponse.json({
        error: error.message
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}

// PUT - Update specific workshop item
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || userData?.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    // Update workshop item
    const { data, error } = await supabase
      .from('section_items')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating workshop item:', error)

      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Workshop item updated successfully'
    })

  } catch (error) {
    console.error('Workshop API PUT error:', error)

    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
