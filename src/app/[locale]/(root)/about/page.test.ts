import {describe, expect, it, vi} from 'vitest'

const permanentRedirect = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({permanentRedirect}))
vi.mock('next-intl', () => ({useTranslations: () => (key: string) => key}))

import AboutPage from './page'

describe('legacy about route', () => {
  it('permanently redirects to the locale-preserving V2 artist route', async () => {
    await AboutPage({params: Promise.resolve({locale: 'ky'})})

    expect(permanentRedirect).toHaveBeenCalledWith('/ky/artist')
  })

  it('redirects legacy English routes to the prefixless V2 route', async () => {
    await AboutPage({params: Promise.resolve({locale: 'en'})})

    expect(permanentRedirect).toHaveBeenLastCalledWith('/artist')
  })
})
