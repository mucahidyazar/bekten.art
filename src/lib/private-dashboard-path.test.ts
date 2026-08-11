import {describe, expect, it} from 'vitest'

import {isPrivateDashboardPath} from './private-dashboard-path'

describe('private Dashboard path recognition', () => {
  it.each([
    '/dashboard',
    '/dashboard/media',
    '/tr/dashboard',
    '/de/dashboard/users',
    '/pt-BR/dashboard/activity',
  ])('recognizes %s as private', pathname => {
    expect(isPrivateDashboardPath(pathname)).toBe(true)
  })

  it.each(['/de/works', '/dashboard-public', '/invalid_locale/dashboard'])(
    'does not classify %s as private',
    pathname => {
      expect(isPrivateDashboardPath(pathname)).toBe(false)
    },
  )

  it.each([null, undefined])(
    'treats an unavailable pathname (%s) as public during hydration',
    pathname => {
      expect(isPrivateDashboardPath(pathname)).toBe(false)
    },
  )
})
