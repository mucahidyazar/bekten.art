function isPrivateIpv4Host(hostname: string) {
  return (
    hostname.startsWith('10.') ||
    hostname.startsWith('127.') ||
    hostname.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  )
}

export function shouldBypassImageOptimization(src: string) {
  if (!src.startsWith('http://') && !src.startsWith('https://')) {
    return false
  }

  try {
    const url = new URL(src)

    return url.hostname === 'localhost' || isPrivateIpv4Host(url.hostname)
  } catch {
    return false
  }
}
