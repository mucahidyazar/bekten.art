import {describe, expect, it, vi} from 'vitest'

import {
  fetchSafeHtml,
  isPublicIpAddress,
  validatePreviewUrl,
  type PreviewHttpResponse,
  type ResolvedAddress,
} from './safe-link-preview'

const publicAddress: ResolvedAddress = {address: '93.184.216.34', family: 4}

function htmlResponse(
  overrides: Partial<PreviewHttpResponse> = {},
): PreviewHttpResponse {
  return {
    body: new TextEncoder().encode('<html><title>Safe</title></html>'),
    headers: {'content-type': 'text/html; charset=utf-8'},
    status: 200,
    ...overrides,
  }
}

describe('validatePreviewUrl', () => {
  it.each([
    'file:///etc/passwd',
    'ftp://example.com/file',
    'javascript:alert(1)',
    'https://user:secret@example.com',
    'https://localhost',
    'https://api.localhost/path',
    'https://metadata.google.internal/computeMetadata/v1',
    'https://example.com:3000/admin',
  ])('rejects an unsafe URL: %s', (input) => {
    expect(() => validatePreviewUrl(input)).toThrow()
  })

  it('accepts ordinary HTTP and HTTPS pages on standard ports', () => {
    expect(validatePreviewUrl('https://example.com/article').href).toBe(
      'https://example.com/article',
    )
    expect(validatePreviewUrl('http://example.com:80/').href).toBe(
      'http://example.com/',
    )
  })
})

describe('isPublicIpAddress', () => {
  it.each([
    '0.0.0.0',
    '10.0.0.1',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '192.168.1.1',
    '198.18.0.1',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    '::ffff:127.0.0.1',
    'fc00::1',
    'fd12:3456::1',
    'fe80::1',
    'ff02::1',
    '2001:db8::1',
  ])('blocks non-public address %s', (address) => {
    expect(isPublicIpAddress(address)).toBe(false)
  })

  it.each(['1.1.1.1', '8.8.8.8', '2606:4700:4700::1111']) (
    'accepts public address %s',
    (address) => {
      expect(isPublicIpAddress(address)).toBe(true)
    },
  )
})

describe('fetchSafeHtml', () => {
  it('requires every DNS result to be public before making a request', async () => {
    const requestUrl = vi.fn(async () => htmlResponse())

    await expect(
      fetchSafeHtml('https://example.com', {
        resolveHost: async () => [
          publicAddress,
          {address: '169.254.169.254', family: 4},
        ],
        requestUrl,
      }),
    ).rejects.toThrow(/public/i)

    expect(requestUrl).not.toHaveBeenCalled()
  })

  it('pins the request to a validated DNS address', async () => {
    const requestUrl = vi.fn(async () => htmlResponse())

    await fetchSafeHtml('https://example.com', {
      resolveHost: async () => [publicAddress],
      requestUrl,
    })

    expect(requestUrl).toHaveBeenCalledWith(
      new URL('https://example.com'),
      publicAddress,
      expect.objectContaining({signal: expect.any(AbortSignal)}),
    )
  })

  it('resolves and validates every redirect target before following it', async () => {
    const resolvedHosts: string[] = []
    const resolveHost = vi.fn(async (hostname: string) => {
      resolvedHosts.push(hostname)

      return hostname === 'private.example'
        ? [{address: '10.0.0.10', family: 4} as ResolvedAddress]
        : [publicAddress]
    })
    const requestUrl = vi
      .fn()
      .mockResolvedValueOnce(
        htmlResponse({
          body: new Uint8Array(),
          headers: {location: 'https://private.example/secret'},
          status: 302,
        }),
      )

    await expect(
      fetchSafeHtml('https://example.com/start', {resolveHost, requestUrl}),
    ).rejects.toThrow(/public/i)

    expect(resolvedHosts).toEqual(['example.com', 'private.example'])
    expect(requestUrl).toHaveBeenCalledTimes(1)
  })

  it('limits redirects', async () => {
    const requestUrl = vi.fn(async () =>
      htmlResponse({
        body: new Uint8Array(),
        headers: {location: '/again'},
        status: 302,
      }),
    )

    await expect(
      fetchSafeHtml('https://example.com', {
        maxRedirects: 1,
        resolveHost: async () => [publicAddress],
        requestUrl,
      }),
    ).rejects.toThrow(/redirect/i)
  })

  it('enforces HTML content type and response size', async () => {
    const resolveHost = async () => [publicAddress]

    await expect(
      fetchSafeHtml('https://example.com/data', {
        requestUrl: async () =>
          htmlResponse({headers: {'content-type': 'application/json'}}),
        resolveHost,
      }),
    ).rejects.toThrow(/content type/i)

    await expect(
      fetchSafeHtml('https://example.com/large', {
        maxBytes: 8,
        requestUrl: async () => htmlResponse(),
        resolveHost,
      }),
    ).rejects.toThrow(/large/i)
  })

  it('aborts work that exceeds the total time limit', async () => {
    await expect(
      fetchSafeHtml('https://example.com/slow', {
        resolveHost: async () => [publicAddress],
        requestUrl: async (_url, _address, {signal}) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason), {
              once: true,
            })
          }),
        timeoutMs: 10,
      }),
    ).rejects.toThrow(/timed out/i)
  })
})
