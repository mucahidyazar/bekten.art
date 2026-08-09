import {describe, expect, it} from 'vitest'

import {
  boundedBodyBytes,
  boundedText,
  normalizeActorId,
  normalizeInstagramUsername,
  safeLegacyObjectKey,
  validateCanonicalHttpsUrl,
  validateInstagramImageUrl,
  validateResultsLimit,
} from '../../../scripts/media-safety.mjs'

describe('one-shot migration safety', () => {
  it('builds collision-resistant keys without preserving traversal input', () => {
    const id = '44e9e0d0-77d1-498c-a9aa-15b7e040e1cc'

    expect(safeLegacyObjectKey('gallery/portrait one.jpg', id)).toBe(
      `legacy/${id}/portrait-one.jpg`,
    )
    expect(safeLegacyObjectKey('../../environment', id)).toBe(
      `legacy/${id}/legacy-object`,
    )
    expect(() => safeLegacyObjectKey('portrait.jpg', '../id')).toThrow(
      'Legacy media ID is invalid',
    )
  })

  it('requires a canonical HTTPS application URL', () => {
    expect(validateCanonicalHttpsUrl('https://bekten.art/').toString()).toBe(
      'https://bekten.art/',
    )
    expect(() => validateCanonicalHttpsUrl('http://bekten.art')).toThrow(
      'Canonical URL must use HTTPS',
    )
    expect(() =>
      validateCanonicalHttpsUrl('https://user:secret@bekten.art'),
    ).toThrow('Canonical URL is invalid')
    expect(() =>
      validateCanonicalHttpsUrl('https://bekten.art/admin'),
    ).toThrow('Canonical URL is invalid')
  })
})

describe('Instagram sync boundary validation', () => {
  it('normalizes only an Apify actor identifier with one owner/name separator', () => {
    expect(normalizeActorId('apify/instagram-api-scraper')).toBe(
      'apify~instagram-api-scraper',
    )
    expect(() => normalizeActorId('../internal')).toThrow(
      'APIFY_ACTOR_ID is invalid',
    )
    expect(() => normalizeActorId('https://example.com/actor')).toThrow(
      'APIFY_ACTOR_ID is invalid',
    )
  })

  it('accepts bounded Instagram usernames and result limits only', () => {
    expect(normalizeInstagramUsername('@Bekten_Usubaliev')).toBe(
      'bekten_usubaliev',
    )
    expect(() => normalizeInstagramUsername('../profile')).toThrow(
      'Instagram username is invalid',
    )
    expect(validateResultsLimit('60')).toBe(60)
    expect(() => validateResultsLimit('0')).toThrow(
      'APIFY_RESULTS_LIMIT must be an integer between 1 and 100',
    )
    expect(() => validateResultsLimit('1000')).toThrow(
      'APIFY_RESULTS_LIMIT must be an integer between 1 and 100',
    )
  })

  it('blocks untrusted image hosts and URL credential tricks', () => {
    expect(
      validateInstagramImageUrl(
        'https://scontent-ams2-1.cdninstagram.com/image.jpg',
      ).hostname,
    ).toBe('scontent-ams2-1.cdninstagram.com')
    expect(() =>
      validateInstagramImageUrl(
        'https://cdninstagram.com.attacker.example/image.jpg',
      ),
    ).toThrow('Instagram image host is not allowed')
    expect(() =>
      validateInstagramImageUrl(
        'https://user:secret@scontent.cdninstagram.com/image.jpg',
      ),
    ).toThrow('Instagram image host is not allowed')
  })

  it('bounds streamed response bodies even without content-length', async () => {
    const body = new Response(new Uint8Array([1, 2, 3, 4])).body

    await expect(boundedBodyBytes(body, 3)).rejects.toThrow(
      'Response body exceeds the size limit',
    )
    await expect(
      boundedBodyBytes(new Response(new Uint8Array([1, 2, 3])).body, 3),
    ).resolves.toEqual(Buffer.from([1, 2, 3]))
    await expect(boundedBodyBytes(null, 3)).rejects.toThrow(
      'Response body is empty',
    )
    await expect(
      boundedBodyBytes(new Response('ok').body, 0),
    ).rejects.toThrow('Response body limit is invalid')

    async function* chunks() {
      yield Buffer.from([1])
      yield Buffer.from([2])
    }

    await expect(boundedBodyBytes(chunks(), 2)).resolves.toEqual(
      Buffer.from([1, 2]),
    )
  })

  it('normalizes and bounds external text before persistence', () => {
    expect(boundedText('  hello\u0000 world  ', 20)).toBe('hello world')
    expect(boundedText('abcdef', 3)).toBe('abc')
    expect(boundedText(null, 20)).toBeNull()
  })
})
