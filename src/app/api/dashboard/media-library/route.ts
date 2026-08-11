import {NextResponse} from 'next/server'

import {z} from 'zod'

import {prisma} from '@/lib/db'
import {isSameOriginMutation} from '@/server/auth/mutation-origin'
import {configuredMediaLibraryService} from '@/server/media-library/configured-media-library'
import {mediaLibraryCommandSchema} from '@/server/media-library/media-library-service'
import {requireStudioEditor} from '@/server/studio-auth/configured-access'
import {
  StudioAuthenticationRequiredError,
  StudioEditorRequiredError,
  isStudioOwnerRole,
} from '@/server/studio-auth/roles'

import type {Prisma} from '@prisma/client'

const MAX_COMMAND_BYTES = 16 * 1024
const MEDIA_PAGE_SIZE = 100
const mediaPageQuerySchema = z
  .object({cursor: z.uuid().optional()})
  .strict()

function mediaVisibilityWhere(canDelete: boolean): Prisma.MediaObjectWhereInput {
  return canDelete
    ? {
        provider: 'garage',
        status: {in: ['READY', 'FAILED', 'QUARANTINED']},
      }
    : {
        provider: 'garage',
        status: 'READY',
        visibility: 'PUBLIC',
      }
}

function appOrigin() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    ''
  )
}

function requestIsBoundedJson(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  const length = Number(request.headers.get('content-length'))

  return (
    contentType.toLowerCase().startsWith('application/json') &&
    Number.isSafeInteger(length) &&
    length > 0 &&
    length <= MAX_COMMAND_BYTES
  )
}

function errorResponse(error: unknown) {
  if (error instanceof StudioAuthenticationRequiredError) {
    return NextResponse.json({error: 'Authentication required'}, {status: 401})
  }

  if (error instanceof StudioEditorRequiredError) {
    return NextResponse.json(
      {error: 'Studio editor access required'},
      {status: 403},
    )
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json({error: 'Invalid media command'}, {status: 400})
  }

  const code = error instanceof Error ? error.message : ''

  if (code === 'MEDIA_DELETE_FORBIDDEN') {
    return NextResponse.json({error: 'Owner access required'}, {status: 403})
  }

  if (code === 'MEDIA_FOLDER_NOT_FOUND' || code === 'MEDIA_NOT_FOUND') {
    return NextResponse.json({error: 'Media item not found'}, {status: 404})
  }

  if (
    code === 'MEDIA_FOLDER_CYCLE' ||
    code === 'MEDIA_FOLDER_NOT_EMPTY' ||
    code === 'MEDIA_FOLDER_TREE_INVALID' ||
    code === 'MEDIA_VERSION_CONFLICT' ||
    (typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002')
  ) {
    return NextResponse.json(
      {
        error:
          code === 'MEDIA_FOLDER_NOT_EMPTY'
            ? 'Empty the folder before deleting it.'
            : 'The media library changed. Refresh and try again.',
      },
      {status: 409},
    )
  }

  return NextResponse.json(
    {error: 'Unable to update the media library'},
    {status: 500},
  )
}

export async function GET(request: Request) {
  try {
    const user = await requireStudioEditor()
    const url = new URL(request.url)
    const query = mediaPageQuerySchema.parse({
      cursor: url.searchParams.get('cursor') || undefined,
    })
    const where = mediaVisibilityWhere(isStudioOwnerRole(user.role))
    const [rows, total] = await Promise.all([
      prisma.mediaObject.findMany({
        ...(query.cursor
          ? {cursor: {id: query.cursor}, skip: 1}
          : {}),
        orderBy: [{createdAt: 'desc'}, {id: 'desc'}],
        select: {
          createdAt: true,
          displayName: true,
          filename: true,
          folderId: true,
          height: true,
          id: true,
          sizeBytes: true,
          status: true,
          version: true,
          width: true,
        },
        take: MEDIA_PAGE_SIZE + 1,
        where,
      }),
      prisma.mediaObject.count({where}),
    ])
    const items = rows.slice(0, MEDIA_PAGE_SIZE)
    const nextCursor =
      rows.length > MEDIA_PAGE_SIZE ? items.at(-1)?.id ?? null : null

    return NextResponse.json(
      {
        items: items.map(item => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        })),
        nextCursor,
        total,
      },
      {headers: {'cache-control': 'private, no-store'}},
    )
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  const origin = appOrigin()

  if (!origin || !isSameOriginMutation(request, origin)) {
    return NextResponse.json(
      {error: 'Request origin is not allowed'},
      {status: 403},
    )
  }

  if (!requestIsBoundedJson(request)) {
    return NextResponse.json({error: 'Invalid media command'}, {status: 400})
  }

  try {
    const user = await requireStudioEditor()
    const command = mediaLibraryCommandSchema.parse(await request.json())
    const result = await configuredMediaLibraryService.execute({
      actorUserId: user.id,
      canDelete: isStudioOwnerRole(user.role),
      command,
    })

    return NextResponse.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}

export const dynamic = 'force-dynamic'
