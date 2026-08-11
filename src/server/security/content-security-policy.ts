const NONCE_PATTERN = /^[A-Za-z0-9+/_=-]+$/

interface ContentSecurityPolicyOptions {
  mediaOrigin?: string
  nonce: string
  production: boolean
}

function validatedMediaOrigin(value: string | undefined, production: boolean) {
  if (!value) return ''

  try {
    const url = new URL(value)
    const localhostOrigin =
      url.hostname === 'localhost' &&
      (url.protocol === 'http:' || url.protocol === 'https:')

    if (
      (production && url.protocol !== 'https:') ||
      (!production && !localhostOrigin && url.protocol !== 'https:') ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error('Invalid media origin')
    }

    return url.origin
  } catch {
    throw new Error('Invalid media origin')
  }
}

export function buildContentSecurityPolicy({
  mediaOrigin,
  nonce,
  production,
}: ContentSecurityPolicyOptions) {
  if (!NONCE_PATTERN.test(nonce)) {
    throw new Error('Invalid CSP nonce')
  }

  const allowedMediaOrigin = validatedMediaOrigin(mediaOrigin, production)

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${production ? '' : " 'unsafe-eval'"} https://www.googletagmanager.com https://www.google-analytics.com`,
    `script-src-elem 'self' 'nonce-${nonce}' 'strict-dynamic'${production ? '' : " 'unsafe-eval'"} https://www.googletagmanager.com https://www.google-analytics.com`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com https://*.googleusercontent.com https://*.fbcdn.net https://scontent.cdninstagram.com${allowedMediaOrigin ? ` ${allowedMediaOrigin}` : ''}`,
    "media-src 'self' blob:",
    "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://*.googletagmanager.com",
    "frame-src 'self' https://www.google.com https://www.youtube-nocookie.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ]

  return [...directives, ...(production ? ['upgrade-insecure-requests'] : [])]
    .join('; ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
