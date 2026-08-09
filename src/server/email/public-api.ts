import {NextResponse} from 'next/server'

import {
  InvalidRequestBodyError,
  readBoundedText,
  RequestBodyTooLargeError,
} from '@/server/http/bounded-body'

const DEFAULT_MAX_BYTES = 24 * 1_024

export class PublicApiInputError extends Error {}

export function getPublicAppOrigin(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  const configured =
    environment.NEXT_PUBLIC_APP_URL?.trim() || environment.NEXTAUTH_URL?.trim()

  if (!configured) {
    throw new Error('PUBLIC_API_CONFIGURATION_INVALID')
  }

  return new URL(configured).origin
}

export function publicJson(
  payload: unknown,
  status: number,
  headers?: HeadersInit,
) {
  return NextResponse.json(payload, {
    headers: {'Cache-Control': 'private, no-store', ...headers},
    status,
  })
}

export async function readPublicJson(
  request: Request,
  maxBytes = DEFAULT_MAX_BYTES,
) {
  const contentType = request.headers.get('content-type') ?? ''
  const rawContentLength = request.headers.get('content-length')
  const contentLength = rawContentLength ? Number(rawContentLength) : 0

  if (
    !contentType.toLowerCase().startsWith('application/json') ||
    !Number.isFinite(contentLength) ||
    contentLength < 0 ||
    contentLength > maxBytes
  ) {
    throw new PublicApiInputError('INVALID_PUBLIC_JSON')
  }

  let rawBody: string

  try {
    rawBody = await readBoundedText(request, maxBytes)
  } catch (error) {
    if (
      error instanceof InvalidRequestBodyError ||
      error instanceof RequestBodyTooLargeError
    ) {
      throw new PublicApiInputError('INVALID_PUBLIC_JSON')
    }

    throw error
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(rawBody)
  } catch {
    throw new PublicApiInputError('INVALID_PUBLIC_JSON')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new PublicApiInputError('INVALID_PUBLIC_JSON')
  }

  return parsed as Readonly<Record<string, unknown>>
}
