export class InvalidRequestBodyError extends Error {
  constructor() {
    super('INVALID_REQUEST_BODY')
    this.name = 'InvalidRequestBodyError'
  }
}

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super('REQUEST_BODY_TOO_LARGE')
    this.name = 'RequestBodyTooLargeError'
  }
}

function declaredLength(request: Request) {
  const raw = request.headers.get('content-length')

  if (raw === null) return null
  if (!/^\d+$/u.test(raw)) throw new InvalidRequestBodyError()

  const parsed = Number(raw)

  if (!Number.isSafeInteger(parsed)) throw new InvalidRequestBodyError()

  return parsed
}

function decodeUtf8(chunks: readonly Uint8Array[], byteLength: number) {
  const bytes = new Uint8Array(byteLength)
  let offset = 0

  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return new TextDecoder('utf-8', {fatal: true}).decode(bytes)
  } catch {
    throw new InvalidRequestBodyError()
  }
}

export async function readBoundedText(request: Request, maxBytes: number) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new RangeError('maxBytes must be a positive safe integer')
  }

  const encoding = request.headers.get('content-encoding')?.trim().toLowerCase()

  if (encoding && encoding !== 'identity') {
    throw new InvalidRequestBodyError()
  }

  const expectedBytes = declaredLength(request)

  if (expectedBytes !== null && expectedBytes > maxBytes) {
    throw new RequestBodyTooLargeError()
  }

  if (!request.body) return ''

  const reader = request.body.getReader()
  let byteLength = 0
  let chunks: readonly Uint8Array[] = []

  try {
    while (true) {
      const {done, value} = await reader.read()

      if (done) break

      byteLength += value.byteLength

      if (byteLength > maxBytes) {
        await reader.cancel().catch(() => undefined)

        throw new RequestBodyTooLargeError()
      }

      chunks = [...chunks, value]
    }
  } finally {
    reader.releaseLock()
  }

  return decodeUtf8(chunks, byteLength)
}
