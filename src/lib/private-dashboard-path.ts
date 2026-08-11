import {isSafeLocaleCode} from './localized-path'

export function isPrivateDashboardPath(pathname: string | null | undefined) {
  if (!pathname) return false

  const segments = pathname.split('/').filter(Boolean)

  if (segments[0] === 'dashboard') return true

  return Boolean(
    segments[0] &&
      isSafeLocaleCode(segments[0]) &&
      segments[1] === 'dashboard',
  )
}
