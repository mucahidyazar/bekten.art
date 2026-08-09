import {NextResponse} from 'next/server'

import {ZodError} from 'zod'

import {prisma} from '@/lib/db'
import {
  AdminAccessRequiredError,
  AuthenticationRequiredError,
  RecentAuthenticationRequiredError,
  requireAdminUser,
  requireRecentAdminUser,
} from '@/server/auth/access'
import {isSameOriginMutation} from '@/server/auth/mutation-origin'
import {contactInfoCreateSchema, contentLocaleSchema} from '@/server/content/domain'
import {
  InvalidRequestBodyError,
  readBoundedText,
  RequestBodyTooLargeError,
} from '@/server/http/bounded-body'

function responseError(error: unknown) {
  if (error instanceof AuthenticationRequiredError) {
    return NextResponse.json({error: 'Authentication required'}, {status: 401})
  }

  if (error instanceof AdminAccessRequiredError) {
    return NextResponse.json({error: 'Admin access required'}, {status: 403})
  }

  if (error instanceof RecentAuthenticationRequiredError) {
    return NextResponse.json({error: 'Recent authentication required'}, {status: 403})
  }

  if (error instanceof ZodError) {
    return NextResponse.json({error: 'Invalid contact information'}, {status: 400})
  }

  if (error instanceof RequestBodyTooLargeError) {
    return NextResponse.json({error: 'Request body is too large'}, {status: 413})
  }

  if (error instanceof InvalidRequestBodyError || error instanceof SyntaxError) {
    return NextResponse.json({error: 'Invalid contact information'}, {status: 400})
  }

  console.error('Contact information request failed')

  return NextResponse.json({error: 'Unable to process contact information'}, {status: 500})
}

function serializedContact(contact: {
  address: string
  email: string
  instagramUrl: string | null
  isPrimary: boolean
  locale: string
  mapEmbedUrl: string | null
  phone: string
  updatedAt: Date
  workingHours: string | null
}) {
  return Object.freeze({
    address: contact.address,
    email: contact.email,
    instagramUrl: contact.instagramUrl,
    isPrimary: contact.isPrimary,
    locale: contact.locale,
    mapEmbedUrl: contact.mapEmbedUrl,
    phone: contact.phone,
    updatedAt: contact.updatedAt.toISOString(),
    workingHours: contact.workingHours,
  })
}

export async function GET(request: Request) {
  try {
    await requireAdminUser()

    const locale = contentLocaleSchema.parse(
      new URL(request.url).searchParams.get('locale') || 'en',
    )
    const contact = await prisma.contactInfo.findUnique({where: {locale}})

    return NextResponse.json({
      contactInfo: contact ? serializedContact(contact) : null,
    })
  } catch (error) {
    return responseError(error)
  }
}

export async function POST(request: Request) {
  try {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim()

    if (!appUrl || !isSameOriginMutation(request, appUrl)) {
      return NextResponse.json({error: 'Request origin is not allowed'}, {status: 403})
    }

    const admin = await requireRecentAdminUser()
    const input = contactInfoCreateSchema.parse(
      JSON.parse(await readBoundedText(request, 24 * 1_024)),
    )
    const contact = await prisma.$transaction(async transaction => {
      const saved = await transaction.contactInfo.upsert({
        create: input,
        update: {
          address: input.address,
          email: input.email,
          instagramUrl: input.instagramUrl ?? null,
          isPrimary: input.isPrimary,
          mapEmbedUrl: input.mapEmbedUrl ?? null,
          phone: input.phone,
          workingHours: input.workingHours ?? null,
        },
        where: {locale: input.locale},
      })

      await transaction.auditEvent.create({
        data: {
          action: 'contact.updated',
          actorUserId: admin.id,
          entityId: saved.id,
          entityType: 'ContactInfo',
          metadata: {locale: saved.locale},
        },
      })

      return saved
    })

    return NextResponse.json({contactInfo: serializedContact(contact), success: true})
  } catch (error) {
    return responseError(error)
  }
}

export const dynamic = 'force-dynamic'
