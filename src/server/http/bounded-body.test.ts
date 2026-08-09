import {describe, expect, it, vi} from 'vitest'

import {
  InvalidRequestBodyError,
  readBoundedText,
  RequestBodyTooLargeError,
} from './bounded-body'

function streamedRequest(chunks: readonly string[]) {
  const encoder = new TextEncoder()
  const cancel = vi.fn()
  const stream = new ReadableStream<Uint8Array>({
    cancel,
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })

  return {
    cancel,
    request: new Request('https://bekten.art/api/test', {
      body: stream,
      duplex: 'half',
      method: 'POST',
    } as RequestInit & {duplex: 'half'}),
  }
}

describe('readBoundedText', () => {
  it('reads a chunked body without relying on content-length', async () => {
    const {request} = streamedRequest(['hello', ' ', 'world'])

    await expect(readBoundedText(request, 11)).resolves.toBe('hello world')
  })

  it('cancels a chunked body as soon as the byte limit is exceeded', async () => {
    const encoder = new TextEncoder()
    const cancel = vi.fn()
    const chunks = ['1234', '5678'] as const
    let index = 0
    const stream = new ReadableStream<Uint8Array>({
      cancel,
      pull(controller) {
        const chunk = chunks[index]

        if (chunk) {
          controller.enqueue(encoder.encode(chunk))
          index += 1
        }
      },
    })
    const request = new Request('https://bekten.art/api/test', {
      body: stream,
      duplex: 'half',
      method: 'POST',
    } as RequestInit & {duplex: 'half'})

    await expect(readBoundedText(request, 7)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError,
    )
    expect(cancel).toHaveBeenCalledOnce()
  })

  it('rejects oversized declarations and encoded request bodies before reading', async () => {
    await expect(
      readBoundedText(
        new Request('https://bekten.art/api/test', {
          body: 'small',
          headers: {'content-length': '999'},
          method: 'POST',
        }),
        20,
      ),
    ).rejects.toBeInstanceOf(RequestBodyTooLargeError)

    await expect(
      readBoundedText(
        new Request('https://bekten.art/api/test', {
          body: 'compressed',
          headers: {'content-encoding': 'gzip'},
          method: 'POST',
        }),
        20,
      ),
    ).rejects.toBeInstanceOf(InvalidRequestBodyError)
  })

  it('rejects malformed UTF-8 instead of replacing signed payload bytes', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(Uint8Array.from([0xc3, 0x28]))
        controller.close()
      },
    })
    const request = new Request('https://bekten.art/api/test', {
      body: stream,
      duplex: 'half',
      method: 'POST',
    } as RequestInit & {duplex: 'half'})

    await expect(readBoundedText(request, 20)).rejects.toBeInstanceOf(
      InvalidRequestBodyError,
    )
  })
})
