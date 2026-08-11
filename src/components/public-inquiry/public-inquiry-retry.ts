const DEFAULT_RETRY_SECONDS = 60
const MAX_RETRY_SECONDS = 3_600

export function responseRetryDelay(response: Response) {
  if (response.status !== 429) return null

  const header = response.headers.get('Retry-After')

  if (!header || !/^\d+$/u.test(header)) return DEFAULT_RETRY_SECONDS

  return Math.min(Math.max(Number.parseInt(header, 10), 1), MAX_RETRY_SECONDS)
}
