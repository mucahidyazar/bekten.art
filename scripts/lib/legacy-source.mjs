function isPrivateIpv4(hostname) {
  const octets = hostname.split('.').map(Number)

  if (
    octets.length !== 4 ||
    octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false
  }

  const [first, second] = octets

  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  )
}

function isPrivateHost(hostname) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/gu, '')

  return (
    normalized === 'localhost' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    isPrivateIpv4(normalized)
  )
}

export function validateLegacySourceUrl(
  candidate,
  {allowPrivateHttp = false} = {},
) {
  let url

  try {
    url = new URL(candidate)
  } catch {
    throw new Error('POCKETBASE_URL is invalid')
  }

  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !['/', '/_', '/_/'].includes(url.pathname)
  ) {
    throw new Error('POCKETBASE_URL must be a credential-free origin')
  }

  if (url.protocol === 'https:') return url.origin

  if (
    url.protocol === 'http:' &&
    allowPrivateHttp &&
    isPrivateHost(url.hostname)
  ) {
    return url.origin
  }

  throw new Error('POCKETBASE_URL must use HTTPS')
}
