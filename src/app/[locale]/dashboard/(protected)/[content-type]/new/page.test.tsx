import {describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  editor: vi.fn(
    ({initialLocale}: {initialLocale?: string}) => (
      <p>Initial locale: {initialLocale}</p>
    ),
  ),
}))

vi.mock('../../../editorial-pages', () => ({
  StudioEditorialEditorPage: mocks.editor,
}))

import StudioContentCreateRoute from './page'

describe('Studio localized content creation route', () => {
  it('prefills the locale selected in Language coverage', async () => {
    const result = await StudioContentCreateRoute({
      params: Promise.resolve({
        'content-type': 'artworks',
        locale: 'en',
      }),
      searchParams: Promise.resolve({locale: 'ru'}),
    })

    expect(result.props.initialLocale).toBe('ru')
  })
})
