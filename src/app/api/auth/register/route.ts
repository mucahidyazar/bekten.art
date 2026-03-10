import {NextResponse} from 'next/server'

import {hash} from 'bcryptjs'

import {prisma} from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      name?: string
      password?: string
    }

    const email = String(body.email ?? '').trim().toLowerCase()
    const name = String(body.name ?? '').trim()
    const password = String(body.password ?? '')

    if (!email || !password || password.length < 8 || name.length < 2) {
      return NextResponse.json(
        {
          error: 'Name, email, and an 8+ character password are required.',
          success: false,
        },
        {status: 400},
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: {email},
    })

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'An account with this email already exists.',
          success: false,
        },
        {status: 409},
      )
    }

    const passwordHash = await hash(password, 12)

    await prisma.user.create({
      data: {
        email,
        emailVerified: new Date(),
        name,
        passwordHash,
        role: 'USER',
      },
    })

    return NextResponse.json({success: true})
  } catch (error) {
    console.error('Register API error:', error)

    return NextResponse.json(
      {
        error: 'Failed to create account.',
        success: false,
      },
      {status: 500},
    )
  }
}

export const dynamic = 'force-dynamic'
