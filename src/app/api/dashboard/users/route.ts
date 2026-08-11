import {NextResponse} from 'next/server'

import {isSameOriginMutation} from '@/server/auth/mutation-origin'
import {requireStudioOwner} from '@/server/studio-auth/configured-access'
import {
  StudioAuthenticationRequiredError,
  StudioOwnerRequiredError,
} from '@/server/studio-auth/roles'
import {getConfiguredStudioUsers} from '@/server/studio-users/configured-studio-users'
import {studioUserCommandSchema} from '@/server/studio-users/studio-user-service'

const MAX_COMMAND_BYTES = 8 * 1024

function appOrigin() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    ''
  )
}

function isBoundedJson(request: Request) {
  const length = Number(request.headers.get('content-length'))

  return (
    request.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json') === true &&
    Number.isSafeInteger(length) &&
    length > 0 &&
    length <= MAX_COMMAND_BYTES
  )
}

function errorResponse(error: unknown) {
  if (error instanceof StudioAuthenticationRequiredError) {
    return NextResponse.json({error: 'Authentication required'}, {status: 401})
  }

  if (error instanceof StudioOwnerRequiredError) {
    return NextResponse.json({error: 'Owner access required'}, {status: 403})
  }

  const code = error instanceof Error ? error.message : ''

  if (code === 'STUDIO_USER_NOT_FOUND') {
    return NextResponse.json({error: 'Studio user not found.'}, {status: 404})
  }

  if (
    code === 'STUDIO_LAST_OWNER_REQUIRED' ||
    code === 'STUDIO_USER_CONFLICT' ||
    code === 'STUDIO_USER_ALREADY_ACTIVE' ||
    code === 'STUDIO_USER_NOT_INVITED'
  ) {
    const message =
      code === 'STUDIO_LAST_OWNER_REQUIRED'
        ? 'At least one active owner is required.'
        : code === 'STUDIO_USER_ALREADY_ACTIVE'
          ? 'This email already has active Studio access.'
          : code === 'STUDIO_USER_NOT_INVITED'
            ? 'Only pending invitations can be resent.'
            : 'Studio access changed. Refresh and try again.'

    return NextResponse.json({error: message}, {status: 409})
  }

  return NextResponse.json(
    {error: 'Unable to update Studio access.'},
    {status: 500},
  )
}

export async function POST(request: Request) {
  const origin = appOrigin()

  if (!origin || !isSameOriginMutation(request, origin)) {
    return NextResponse.json(
      {error: 'Request origin is not allowed'},
      {status: 403},
    )
  }

  if (!isBoundedJson(request)) {
    return NextResponse.json({error: 'Invalid user command'}, {status: 400})
  }

  let command

  try {
    command = studioUserCommandSchema.parse(await request.json())
  } catch {
    return NextResponse.json({error: 'Invalid user command'}, {status: 400})
  }

  try {
    const owner = await requireStudioOwner()
    const result = await getConfiguredStudioUsers().command(owner.id, command)

    return NextResponse.json({result, success: true})
  } catch (error) {
    return errorResponse(error)
  }
}

export const dynamic = 'force-dynamic'
