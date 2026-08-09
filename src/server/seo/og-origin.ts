type Environment = Readonly<Record<string, string | undefined>>

export function getOgAssetOrigin(environment: Environment = process.env) {
  const configured = environment.NEXT_PUBLIC_APP_URL?.trim()
  let url: URL

  try {
    url = new URL(configured ?? '')
  } catch {
    throw new Error('OG_ASSET_ORIGIN_INVALID')
  }

  const credentialFreeOrigin =
    !url.username &&
    !url.password &&
    url.pathname === '/' &&
    !url.search &&
    !url.hash
  const developmentLoopback =
    environment.NODE_ENV !== 'production' &&
    url.protocol === 'http:' &&
    ['127.0.0.1', '::1', 'localhost'].includes(
      url.hostname.replace(/^\[|\]$/gu, ''),
    )

  if (
    !credentialFreeOrigin ||
    (url.protocol !== 'https:' && !developmentLoopback)
  ) {
    throw new Error('OG_ASSET_ORIGIN_INVALID')
  }

  return url.origin
}
