const LOCAL_ORIGIN = 'https://bekten.art'

function normalizeLocalPath(candidate: string) {
  // Browsers and proxies do not agree on whether encoded path separators are
  // decoded before routing. Rejecting them prevents an apparently local path
  // from becoming a scheme-relative URL after an intermediate decode.
  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    /%(?![0-9A-Fa-f]{2})/.test(candidate) ||
    /%(?:2f|5c|0d|0a)/i.test(candidate) ||
    /[\u0000-\u001F\u007F]/.test(candidate)
  ) {
    return null
  }

  try {
    const parsed = new URL(candidate, LOCAL_ORIGIN)

    if (parsed.origin !== LOCAL_ORIGIN) {
      return null
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

export function safeAuthRedirect(
  redirect: string,
  baseUrl: string,
  fallbackPath: string,
) {
  const base = new URL(baseUrl)
  const fallback = safeRedirectPath(fallbackPath, '/')
  let candidate = redirect

  try {
    if (!redirect.startsWith('/')) {
      const absolute = new URL(redirect)

      if (absolute.origin !== base.origin) {
        return new URL(fallback, base.origin).toString()
      }

      candidate = `${absolute.pathname}${absolute.search}${absolute.hash}`
    }
  } catch {
    return new URL(fallback, base.origin).toString()
  }

  return new URL(safeRedirectPath(candidate, fallback), base.origin).toString()
}

export function safeRedirectPath(
  redirect: string | null | undefined,
  fallbackPath: string,
) {
  const safeFallback = normalizeLocalPath(fallbackPath) ?? '/'

  return redirect ? (normalizeLocalPath(redirect) ?? safeFallback) : safeFallback
}
