import {getConfiguredResendWebhookService} from '@/server/email/configured-resend-webhook'
import {
  InvalidRequestBodyError,
  readBoundedText,
  RequestBodyTooLargeError,
} from '@/server/http/bounded-body'

const MAX_BODY_BYTES = 256 * 1_024

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get('content-length') ?? '0')

  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return new Response('Payload too large', {
      headers: {'Cache-Control': 'private, no-store'},
      status: 413,
    })
  }

  let payload: string

  try {
    payload = await readBoundedText(request, MAX_BODY_BYTES)
  } catch (error) {
    const tooLarge = error instanceof RequestBodyTooLargeError

    if (tooLarge || error instanceof InvalidRequestBodyError) {
      return new Response(tooLarge ? 'Payload too large' : 'Invalid payload', {
        headers: {'Cache-Control': 'private, no-store'},
        status: tooLarge ? 413 : 400,
      })
    }

    throw error
  }

  try {
    await getConfiguredResendWebhookService().handle({
      id: request.headers.get('svix-id') ?? '',
      payload,
      signature: request.headers.get('svix-signature') ?? '',
      timestamp: request.headers.get('svix-timestamp') ?? '',
    })

    return new Response('OK', {
      headers: {'Cache-Control': 'private, no-store'},
      status: 200,
    })
  } catch {
    console.error('Resend webhook rejected')

    return new Response('Invalid webhook', {
      headers: {'Cache-Control': 'private, no-store'},
      status: 400,
    })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
