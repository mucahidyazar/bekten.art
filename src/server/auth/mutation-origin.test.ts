import {describe, expect, it} from 'vitest'

import {isSameOriginMutation} from './mutation-origin'

describe('isSameOriginMutation', () => {
  it('accepts a matching https origin', () => {
    expect(
      isSameOriginMutation(
        new Request('https://bekten.art/api/auth/register', {
          headers: {origin: 'https://bekten.art'},
          method: 'POST',
        }),
        'https://bekten.art',
      ),
    ).toBe(true)
  })

  it.each(['https://attacker.example', 'null', 'not-a-url'])('rejects %s', origin => {
    expect(
      isSameOriginMutation(
        new Request('https://bekten.art/api/auth/register', {
          headers: {origin},
          method: 'POST',
        }),
        'https://bekten.art',
      ),
    ).toBe(false)
  })

  it('fails closed when the browser origin is absent', () => {
    expect(
      isSameOriginMutation(
        new Request('https://bekten.art/api/auth/register', {method: 'POST'}),
        'https://bekten.art',
      ),
    ).toBe(false)
  })
})
