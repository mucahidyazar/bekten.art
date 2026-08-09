import {timingSafeEqual} from 'node:crypto'

export function hasValidSchedulerAuthorization(
  request: Request,
  configuredSecret = process.env.OUTBOX_DISPATCH_SECRET,
) {
  const secret = configuredSecret?.trim() ?? ''
  const authorization = request.headers.get('authorization') ?? ''
  const candidate = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''

  if (secret.length < 32 || candidate.length !== secret.length) return false

  return timingSafeEqual(Buffer.from(candidate), Buffer.from(secret))
}
