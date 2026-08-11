import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {StudioLocaleManager} from './studio-locale-manager'

describe('Studio locale manager', () => {
  it('keeps activation disabled until every interface translation is complete', () => {
    render(
      <StudioLocaleManager
        canManage
        createAction={vi.fn()}
        locales={[
          {
            code: 'de',
            customized: 12,
            missing: 2,
            nativeName: 'Deutsch',
            status: 'DRAFT',
            total: 14,
          },
        ]}
        updateStatusAction={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', {name: 'Translate 2 remaining'}),
    ).toBeDisabled()
  })
})
