const NONCE_PATTERN = /^[A-Za-z0-9+/_=-]+$/

interface ContentSecurityPolicyOptions {
  nonce: string
  production: boolean
}

export function buildContentSecurityPolicy({
  nonce,
  production,
}: ContentSecurityPolicyOptions) {
  if (!NONCE_PATTERN.test(nonce)) {
    throw new Error('Invalid CSP nonce')
  }

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
    "img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com https://*.googleusercontent.com https://*.fbcdn.net https://scontent.cdninstagram.com",
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
