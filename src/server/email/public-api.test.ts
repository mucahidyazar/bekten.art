import {describe, expect, it} from 'vitest'

import {
  getPublicAppOrigin,
  PublicApiInputError,
  publicJson,
  readPublicJson,
} from './public-api'

function request(body: string, headers: HeadersInit = {}) {
  return new Request('https://bekten.art/api/public', {
    body,
    headers: {'content-type': 'application/json', ...headers},
    method: 'POST',
  })
}

describe('public API boundary helpers', () => {
  it('uses the public app origin first and falls back to NextAuth', () => {
    expect(
      getPublicAppOrigin({
        NEXTAUTH_URL: 'https://auth.example.com/path',
        NEXT_PUBLIC_APP_URL: 'https://bekten.art/path',
      }),
    ).toBe('https://bekten.art')
    expect(getPublicAppOrigin({NEXTAUTH_URL: 'https://auth.example.com'})).toBe(
      'https://auth.example.com',
    )
    expect(() => getPublicAppOrigin({})).toThrow(
      'PUBLIC_API_CONFIGURATION_INVALID',
    )
  })

  it('produces private no-store JSON while preserving explicit headers', async () => {
    const response = publicJson({success: true}, 202, {'Retry-After': '60'})

    expect(response.status).toBe(202)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('retry-after')).toBe('60')
    await expect(response.json()).resolves.toEqual({success: true})
  })

  it('reads a bounded strict JSON object', async () => {
    await expect(readPublicJson(request('{"name":"Ada"}'), 100)).resolves.toEqual(
      {name: 'Ada'},
    )
  })

  it.each([
    ['wrong content type', request('{}', {'content-type': 'text/plain'})],
    ['negative length', request('{}', {'content-length': '-1'})],
    ['oversized length', request('{}', {'content-length': '101'})],
    ['encoded body', request('{}', {'content-encoding': 'gzip'})],
    ['malformed JSON', request('{')],
    ['array JSON', request('[]')],
    ['null JSON', request('null')],
  ])('rejects %s', async (_case, invalidRequest) => {
    await expect(readPublicJson(invalidRequest, 100)).rejects.toBeInstanceOf(
      PublicApiInputError,
    )
  })
})
