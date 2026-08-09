// @vitest-environment jsdom

import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  ConsentManager,
  ConsentProvider,
} from '@/components/consent/consent-provider'
import {
  CONSENT_STORAGE_KEY,
  createConsentDecision,
} from '@/components/consent/model'

import {MusicProvider, useMusic} from './music-provider'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

function MusicHarness() {
  const {playTrack, pauseMusic} = useMusic()

  return (
    <>
      <button
        type="button"
        onClick={() =>
          playTrack({
            id: 'track',
            title: 'Quiet studio',
            youtubeId: 'uxLBxGloIGo',
            url: 'https://www.youtube.com/watch?v=uxLBxGloIGo',
          })
        }
      >
        Play
      </button>
      <button type="button" onClick={pauseMusic}>
        Pause
      </button>
    </>
  )
}

describe('MusicProvider privacy and controls', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('opens accessible consent management without creating a YouTube iframe when external media is rejected', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(createConsentDecision(false, false, false)),
    )

    render(
      <ConsentProvider>
        <MusicProvider>
          <MusicHarness />
          <ConsentManager />
        </MusicProvider>
      </ConsentProvider>,
    )

    expect(screen.queryByTitle('YouTube music player')).toBeNull()

    await user.click(screen.getByRole('button', {name: 'Play'}))

    expect(
      await screen.findByRole('dialog', {name: 'preferencesTitle'}),
    ).toBeVisible()
    expect(screen.queryByTitle('YouTube music player')).toBeNull()
  })
})
