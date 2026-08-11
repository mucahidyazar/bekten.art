import {describe, expect, it, vi} from 'vitest'

const permanentRedirect = vi.hoisted(() => vi.fn())
const legacyPage = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({permanentRedirect}))
vi.mock('@/components/public-site/public-managed-route', () => ({
  createPublicManagedRoute: () => ({Page: legacyPage}),
}))

import ArtistPage from './page'

describe('legacy artist route', () => {
  it.each([
    ['en', '/about'],
    ['ky', '/ky/about'],
  ] as const)(
    'redirects %s to the locale-preserving About route',
    async (locale, destination) => {
      await ArtistPage({params: Promise.resolve({locale})})

      expect(permanentRedirect).toHaveBeenLastCalledWith(destination)
    },
  )
})
