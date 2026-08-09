const CANONICAL_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u

export async function boundedBodyBytes(body, maximumBytes) {
  if (!body) {
    throw new Error('Response body is empty')
  }

  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1) {
    throw new Error('Response body limit is invalid')
  }

  const chunks = []
  let totalBytes = 0

  if (typeof body.getReader === 'function') {
    const reader = body.getReader()

    try {
      while (true) {
        const {done, value} = await reader.read()

        if (done) {
          break
        }

        const chunk = Buffer.from(value)

        totalBytes += chunk.byteLength

        if (totalBytes > maximumBytes) {
          await reader.cancel()
          throw new Error('Response body exceeds the size limit')
        }

        chunks.push(chunk)
      }
    } finally {
      reader.releaseLock()
    }
  } else {
    for await (const value of body) {
      const chunk = Buffer.from(value)

      totalBytes += chunk.byteLength

      if (totalBytes > maximumBytes) {
        throw new Error('Response body exceeds the size limit')
      }

      chunks.push(chunk)
    }
  }

  return Buffer.concat(chunks, totalBytes)
}

export function boundedText(value, maximumCharacters) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value
    .replace(/[\u0000-\u001f\u007f]/gu, '')
    .trim()

  if (!normalized) {
    return null
  }

  return Array.from(normalized).slice(0, maximumCharacters).join('')
}

export function normalizeActorId(value) {
  const normalized = value.trim().toLowerCase()

  if (!/^[a-z0-9][a-z0-9_-]{0,63}\/[a-z0-9][a-z0-9_-]{0,127}$/u.test(normalized)) {
    throw new Error('APIFY_ACTOR_ID is invalid')
  }

  return normalized.replace('/', '~')
}

export function normalizeInstagramUsername(value) {
  const normalized = value.trim().replace(/^@/u, '').toLowerCase()

  if (!/^[a-z0-9](?:[a-z0-9._]{0,28}[a-z0-9_])?$/u.test(normalized)) {
    throw new Error('Instagram username is invalid')
  }

  return normalized
}

export function safeLegacyObjectKey(filePath, id) {
  if (!CANONICAL_UUID.test(id)) {
    throw new Error('Legacy media ID is invalid')
  }

  const source = typeof filePath === 'string' ? filePath.trim() : ''
  const unsafe =
    !source ||
    source.includes('..') ||
    source.includes('\\') ||
    source.includes('\u0000')
  const baseName = unsafe ? '' : source.split('/').at(-1) || ''
  const normalized = baseName
    .replace(/[^A-Za-z0-9._ -]/gu, '-')
    .replace(/\s+/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^[-.]+|[-.]+$/gu, '')
    .slice(0, 180)

  return `legacy/${id}/${normalized || 'legacy-object'}`
}

export function validateCanonicalHttpsUrl(value) {
  let parsed

  try {
    parsed = new URL(value)
  } catch {
    throw new Error('Canonical URL is invalid')
  }

  if (
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== '/'
  ) {
    throw new Error('Canonical URL is invalid')
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Canonical URL must use HTTPS')
  }

  return parsed
}

export function validateInstagramImageUrl(value) {
  let parsed

  try {
    parsed = new URL(value)
  } catch {
    throw new Error('Instagram image URL is invalid')
  }

  const allowedHostname =
    parsed.hostname.endsWith('.cdninstagram.com') ||
    parsed.hostname.endsWith('.fbcdn.net')

  if (
    parsed.protocol !== 'https:' ||
    !allowedHostname ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error('Instagram image host is not allowed')
  }

  return parsed
}

export function validateResultsLimit(value) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error('APIFY_RESULTS_LIMIT must be an integer between 1 and 100')
  }

  return parsed
}
