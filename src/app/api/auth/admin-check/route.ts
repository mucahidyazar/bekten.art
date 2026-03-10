import {NextResponse} from 'next/server'

import {getUser} from '@/utils/supabase/server'

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        {error: 'No user found', isAdmin: false},
        {status: 401},
      )
    }

    return NextResponse.json({
      error: null,
      isAdmin: user.isAdmin,
      userId: user.id,
      userRole: user.profile.role || null,
    })
  } catch (error) {
    console.error('Admin check API error:', error)

    return NextResponse.json(
      {error: 'Server error', isAdmin: false},
      {status: 500},
    )
  }
}

export const dynamic = 'force-dynamic'
