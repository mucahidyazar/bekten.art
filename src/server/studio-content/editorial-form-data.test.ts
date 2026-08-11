import {describe, expect, it} from 'vitest'

import {parseEditorialFormData} from './editorial-form-data'

function commonFormData() {
  const formData = new FormData()

  formData.set('locale', 'en')
  formData.set('slug', 'winter-light')
  formData.set('display-order', '4')
  formData.set('seo-title', 'Winter Light — Bekten Art')
  formData.set(
    'seo-description',
    'An editorial record of Winter Light and its material history in the studio archive.',
  )
  formData.set('canonical-path', '/en/works/winter-light')
  formData.set('media-placements', '[]')

  return formData
}

describe('Studio editorial form parsing', () => {
  it('creates a strict artwork edit value from bounded form fields', () => {
    const formData = commonFormData()

    formData.set('title', 'Winter Light')
    formData.set(
      'description',
      'A layered oil painting developed through quiet observations of winter light.',
    )
    formData.set('year', '2025')
    formData.set('medium', 'Oil and pigment on linen')
    formData.set('dimensions', '120 × 90 cm')
    formData.set('availability', 'ON_REQUEST')

    expect(parseEditorialFormData('ARTWORK', formData)).toMatchObject({
      availability: 'ON_REQUEST',
      description: expect.stringContaining('layered oil painting'),
      displayOrder: 4,
      locale: 'en',
      mediaPlacements: [],
      seo: {
        canonicalPath: '/en/works/winter-light',
        noIndex: false,
        title: 'Winter Light — Bekten Art',
      },
      slug: 'winter-light',
      title: 'Winter Light',
      year: 2025,
    })
  })

  it('parses dates and optional fields for an exhibition', () => {
    const formData = commonFormData()

    formData.set('title', 'A Field of Memory')
    formData.set(
      'body',
      'An exhibition tracing material, place, and inherited memory across a new body of work.',
    )
    formData.set('starts-at', '2026-09-10')
    formData.set('ends-at', '2026-10-12')

    expect(parseEditorialFormData('EXHIBITION', formData)).toMatchObject({
      endsAt: new Date('2026-10-12T00:00:00.000Z'),
      startsAt: new Date('2026-09-10T00:00:00.000Z'),
    })
  })

  it('rejects malformed media JSON and lifecycle fields outside the edit contract', () => {
    const formData = commonFormData()

    formData.set('title', 'Winter Light')
    formData.set(
      'description',
      'A layered oil painting developed through quiet observations of winter light.',
    )
    formData.set('availability', 'ON_REQUEST')
    formData.set('media-placements', '{"status":"PUBLISHED"}')
    formData.set('status', 'PUBLISHED')

    expect(() => parseEditorialFormData('ARTWORK', formData)).toThrow()
  })

  it.each([
    [
      'COLLECTION',
      {
        description:
          'A sustained body of work exploring place, material memory, and changing light.',
        title: 'Fields of Memory',
      },
      'description',
    ],
    [
      'JOURNAL_ENTRY',
      {
        body: 'A long-form studio journal entry about material experiments and the origin of the work.',
        excerpt:
          'Notes on material experiments and the origin of a new body of work.',
        title: 'Inside the studio archive',
      },
      'excerpt',
    ],
    [
      'PAGE',
      {
        body: 'A complete editorial page describing the artist, practice, and the history of the studio.',
        eyebrow: 'Artist archive',
        title: 'About the artist',
      },
      'eyebrow',
    ],
    [
      'PRESS_ENTRY',
      {
        body: 'A complete press transcription retained for the private editorial archive.',
        excerpt:
          'A considered review of recent work and its relationship to landscape and memory.',
        outlet: 'Art Review',
        pressCategory: 'REVIEW',
        publishedOn: '2026-08-01',
        sourceUrl: 'https://example.com/review',
        subtitle: 'A critic visits the studio',
        title: 'Material memory in review',
      },
      'outlet',
    ],
  ] as const)(
    'parses the %s editorial form',
    (entityType, values, expectedKey) => {
      const formData = commonFormData()

      for (const [key, value] of Object.entries(values)) {
        formData.set(
          key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`),
          value,
        )
      }
      formData.set('no-index', 'on')

      expect(parseEditorialFormData(entityType, formData)).toMatchObject({
        [expectedKey]: expect.anything(),
        seo: expect.objectContaining({noIndex: true}),
      })
    },
  )

  it('rejects an oversized media placement payload before JSON parsing', () => {
    const formData = commonFormData()

    formData.set('media-placements', ' '.repeat(100_001))

    expect(() => parseEditorialFormData('COLLECTION', formData)).toThrow(
      'STUDIO_MEDIA_PLACEMENTS_TOO_LARGE',
    )
  })
})
