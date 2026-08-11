import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto'

const VERSION = 'v1'
const PURPOSE = 'bekten-art:studio-auth:magic-link-outbox:v1'

function encode(value: Uint8Array) {
  return Buffer.from(value).toString('base64url')
}

function decode(value: string) {
  const decoded = Buffer.from(value, 'base64url')

  if (encode(decoded) !== value) {
    throw new Error('invalid base64url')
  }

  return decoded
}

function encryptionKey(secret: string) {
  if (secret.length < 32) {
    throw new Error('STUDIO_MAGIC_LINK_CONFIGURATION_INVALID')
  }

  return Buffer.from(
    hkdfSync(
      'sha256',
      Buffer.from(secret, 'utf8'),
      Buffer.from('bekten-art:studio-auth:v1', 'utf8'),
      Buffer.from(PURPOSE, 'utf8'),
      32,
    ),
  )
}

export function createStudioMagicLinkSealer(secret: string) {
  const key = encryptionKey(secret)
  const additionalData = Buffer.from(PURPOSE, 'utf8')

  return Object.freeze({
    open(envelope: string) {
      try {
        const [version, nonce, ciphertext, authenticationTag, extra] =
          envelope.split('.')

        if (
          version !== VERSION ||
          !nonce ||
          !ciphertext ||
          !authenticationTag ||
          extra
        ) {
          throw new Error('invalid envelope')
        }

        const decipher = createDecipheriv('aes-256-gcm', key, decode(nonce))

        decipher.setAAD(additionalData)
        decipher.setAuthTag(decode(authenticationTag))

        return Buffer.concat([
          decipher.update(decode(ciphertext)),
          decipher.final(),
        ]).toString('utf8')
      } catch {
        throw new Error('STUDIO_MAGIC_LINK_INVALID')
      }
    },
    seal(plain: string) {
      const parsed = new URL(plain)

      if (
        !['http:', 'https:'].includes(parsed.protocol) ||
        plain.length > 4_096
      ) {
        throw new Error('STUDIO_MAGIC_LINK_INVALID')
      }

      const nonce = randomBytes(12)
      const cipher = createCipheriv('aes-256-gcm', key, nonce)

      cipher.setAAD(additionalData)

      const ciphertext = Buffer.concat([
        cipher.update(plain, 'utf8'),
        cipher.final(),
      ])

      return [
        VERSION,
        encode(nonce),
        encode(ciphertext),
        encode(cipher.getAuthTag()),
      ].join('.')
    },
  })
}
