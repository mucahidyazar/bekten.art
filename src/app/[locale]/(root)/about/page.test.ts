import {describe, expect, it, vi} from 'vitest'

const route = vi.hoisted(() => ({
  Page: vi.fn(),
  generateMetadata: vi.fn(),
}))
const createPublicManagedRoute = vi.hoisted(() => vi.fn(() => route))

vi.mock('@/components/public-site/public-managed-route', () => ({
  createPublicManagedRoute,
}))

import AboutPage, {generateMetadata} from './page'

describe('public about route', () => {
  it('renders the canonical editable About page instead of redirecting away', () => {
    expect(createPublicManagedRoute).toHaveBeenCalledWith({
      kind: 'artist',
      slug: 'about',
    })
    expect(AboutPage).toBe(route.Page)
    expect(generateMetadata).toBe(route.generateMetadata)
  })
})
