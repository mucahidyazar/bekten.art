import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

// GET - Load contact info
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
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || userData?.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get contact info
    const { data: contactInfo, error } = await supabase
      .from('cms_contact_info')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading contact info:', error)

      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      contactInfo: contactInfo || {
        phone: '',
        email: '',
        address: '',
        instagram_url: '',
        working_hours: '',
        map_embed_url: '',
      }
    })
  } catch (error) {
    console.error('Contact info API error:', error)

    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Save contact info
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
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || userData?.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get request body
    const contactInfo = await request.json()

    // Save contact info
    const { error } = await supabase
      .from('cms_contact_info')
      .upsert({
        ...contactInfo,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error saving contact info:', error)

      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact info save API error:', error)

    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
