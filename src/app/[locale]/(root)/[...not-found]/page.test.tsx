import {describe, expect, it, vi} from 'vitest'

const navigation = vi.hoisted(() => ({notFound: vi.fn()}))

vi.mock('next/navigation', () => ({notFound: navigation.notFound}))

import NotFoundRoute from './page'

describe('localized catch-all route', () => {
  it('delegates to the Next not-found boundary so the response is a real 404', async () => {
    navigation.notFound.mockImplementationOnce(() => {
      throw new Error('NEXT_NOT_FOUND')
    })

    expect(() => NotFoundRoute()).toThrow('NEXT_NOT_FOUND')
    expect(navigation.notFound).toHaveBeenCalledOnce()
  })
})
