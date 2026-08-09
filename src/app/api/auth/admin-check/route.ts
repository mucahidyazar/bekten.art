import {NextResponse} from 'next/server'

import {
  AdminAccessRequiredError,
  AuthenticationRequiredError,
  requireAdminUser,
} from '@/server/auth/access'

export async function GET() {
  try {
    const user = await requireAdminUser()

    return NextResponse.json(
      {
        error: null,
        isAdmin: true,
        userId: user.id,
        userRole: user.role,
      },
      {headers: {'Cache-Control': 'private, no-store'}},
    )
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json(
        {error: 'Authentication required', isAdmin: false},
        {status: 401},
      )
    }

    if (error instanceof AdminAccessRequiredError) {
      return NextResponse.json(
        {error: 'Access denied', isAdmin: false},
        {status: 403},
      )
    }

    console.error('Admin authorization check failed')

    return NextResponse.json(
      {error: 'Unable to verify access', isAdmin: false},
      {status: 500},
    )
  }
}

export const dynamic = 'force-dynamic'
