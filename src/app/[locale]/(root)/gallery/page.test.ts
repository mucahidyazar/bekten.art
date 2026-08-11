import {describe, expect, it, vi} from 'vitest'

const permanentRedirect = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({permanentRedirect}))
vi.mock('@/lib/instagram-gallery', () => ({
  getGalleryImageArrays: vi.fn(async () => []),
}))

import GalleryPage from './page'

describe('legacy gallery route', () => {
  it('permanently redirects to the locale-preserving V2 works route', async () => {
    await GalleryPage({params: Promise.resolve({locale: 'tr'})})

    expect(permanentRedirect).toHaveBeenCalledWith('/tr/works')
  })
})
