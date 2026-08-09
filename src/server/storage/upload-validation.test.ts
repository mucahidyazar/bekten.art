import {describe, expect, it} from 'vitest'

import {
  MAX_UPLOAD_BYTES,
  prepareImageUpload,
  validateMediaId,
  validateStorageObjectKey,
  validateStoragePathSegment,
} from './upload-validation'

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

describe('prepareImageUpload', () => {
  it('validates by file signature and emits a sanitized immutable WebP object', async () => {
    const result = await prepareImageUpload({
      file: new File([PNG_1X1], '../../portrait.png', {type: 'image/png'}),
      folder: 'gallery',
    })

    expect(result.bytes.byteLength).toBeGreaterThan(0)
    expect(result.checksumSha256).toMatch(/^[A-Za-z0-9+/]+={0,2}$/u)
    expect(result.checksumSha256Hex).toMatch(/^[a-f0-9]{64}$/u)
    expect(result.contentType).toBe('image/webp')
    expect(result.height).toBe(1)
    expect(result.objectKey).toMatch(/^gallery\/[a-f0-9-]+\.webp$/u)
    expect(result.originalFileName).toBe('portrait.png')
    expect(result.width).toBe(1)
  })

  it('rejects MIME spoofing instead of trusting File.type', async () => {
    await expect(
      prepareImageUpload({
        file: new File(['<script>alert(1)</script>'], 'attack.png', {
          type: 'image/png',
        }),
        folder: 'gallery',
      }),
    ).rejects.toThrow('UPLOAD_FILE_TYPE_INVALID')
  })

  it('rejects oversized uploads before processing them', async () => {
    const oversized = new Uint8Array(MAX_UPLOAD_BYTES + 1)

    await expect(
      prepareImageUpload({
        file: new File([oversized], 'large.png', {type: 'image/png'}),
        folder: 'gallery',
      }),
    ).rejects.toThrow('UPLOAD_FILE_TOO_LARGE')
  })
})

describe('validateStoragePathSegment', () => {
  it.each(['../private', '/root', 'gallery/child', 'a\\b', '.hidden', '']) (
    'rejects unsafe segment %s',
    segment => {
      expect(() => validateStoragePathSegment(segment)).toThrow(
        'UPLOAD_PATH_INVALID',
      )
    },
  )

  it('accepts bounded lowercase logical folders', () => {
    expect(validateStoragePathSegment('gallery-2026')).toBe('gallery-2026')
  })
})

describe('storage identifier validation', () => {
  it.each([
    '../../environment',
    'gallery/../private.webp',
    '/gallery/example.webp',
    'gallery\\example.webp',
    'gallery//example.webp',
    'gallery/example.webp\nheader',
  ])('rejects the unsafe object key %s', objectKey => {
    expect(() => validateStorageObjectKey(objectKey)).toThrow(
      'STORAGE_OBJECT_KEY_INVALID',
    )
  })

  it('accepts a generated nested object key without changing it', () => {
    expect(validateStorageObjectKey('gallery/2026/example-01.webp')).toBe(
      'gallery/2026/example-01.webp',
    )
  })

  it('accepts canonical UUID media identifiers only', () => {
    expect(
      validateMediaId('44e9e0d0-77d1-498c-a9aa-15b7e040e1cc'),
    ).toBe('44e9e0d0-77d1-498c-a9aa-15b7e040e1cc')
    expect(() => validateMediaId('../../all')).toThrow(
      'MEDIA_ID_INVALID',
    )
    expect(() =>
      validateMediaId('44E9E0D0-77D1-498C-A9AA-15B7E040E1CC'),
    ).toThrow('MEDIA_ID_INVALID')
  })
})
