import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user from Supabase (using cookies from middleware)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ isAdmin: false, error: 'No user found' }, { status: 401 })
    }

    // Check user role in database
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile check error:', profileError)

      return NextResponse.json({ isAdmin: false, error: 'Database error' }, { status: 500 })
    }

    const isAdmin = userData?.role?.toLowerCase() === 'admin'

    return NextResponse.json({
      isAdmin,
      error: null,
      userId: user.id,
      userRole: userData?.role || null
    })
  } catch (error) {
    console.error('Admin check API error:', error)

    return NextResponse.json({ isAdmin: false, error: 'Server error' }, { status: 500 })
  }
}
