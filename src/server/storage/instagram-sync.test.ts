import {describe, expect, it} from 'vitest'

import {normalizePosts} from '../../../scripts/sync-instagram-gallery.mjs'

const validPost = Object.freeze({
  alt: 'Portrait',
  caption: 'Gallery opening',
  displayUrl: 'https://scontent.cdninstagram.com/photo.jpg',
  id: 'instagram-media-1',
  ownerUsername: 'bekten_usubaliev',
  shortCode: 'ABC123',
  timestamp: '2026-08-09T00:00:00.000Z',
  type: 'Image',
  url: 'https://www.instagram.com/p/ABC123/',
})

describe('Instagram sync payload normalization', () => {
  it('keeps a bounded, owner-matched projection without arbitrary fields', () => {
    const [post] = normalizePosts(
      [{...validPost, injectedSecret: 'must-not-persist'}],
      'bekten_usubaliev',
      10,
    )

    expect(post).toMatchObject({
      id: validPost.id,
      ownerUsername: 'bekten_usubaliev',
      shortCode: validPost.shortCode,
      timestamp: new Date(validPost.timestamp),
    })
    expect(post.rawPayload).not.toHaveProperty('injectedSecret')
  })

  it('rejects foreign owners, untrusted image URLs and duplicates', () => {
    const posts = normalizePosts(
      [
        {...validPost, ownerUsername: 'another_artist'},
        {...validPost, id: 'media-2', displayUrl: 'https://attacker.example/a.jpg'},
        validPost,
        {...validPost, caption: 'duplicate'},
      ],
      'bekten_usubaliev',
      10,
    )

    expect(posts).toHaveLength(1)
    expect(posts[0]?.caption).toBe('Gallery opening')
  })

  it('bounds text, limits results and constructs a safe permalink fallback', () => {
    const posts = normalizePosts(
      [
        {
          ...validPost,
          caption: ` safe\u0000${'x'.repeat(12_000)}`,
          url: 'javascript:alert(1)',
        },
        {...validPost, id: 'media-2', shortCode: 'SECOND'},
      ],
      '@Bekten_Usubaliev',
      1,
    )

    expect(posts).toHaveLength(1)
    expect(posts[0]?.caption).toHaveLength(10_000)
    expect(posts[0]?.caption).not.toContain('\u0000')
    expect(posts[0]?.url).toBe('https://www.instagram.com/p/ABC123/')
  })
})
