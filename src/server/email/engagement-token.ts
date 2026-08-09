import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'

const VERSION = 'v1'

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

export function createEngagementTokens(secret: string) {
  if (secret.length < 32) {
    throw new Error('ENGAGEMENT_TOKEN_CONFIGURATION_INVALID')
  }

  const encryptionKey = createHash('sha256')
    .update(`bekten-art:engagement:${secret}`)
    .digest()

  function hash(plain: string) {
    return createHash('sha256').update(plain).digest('hex')
  }

  function encrypt(plain: string) {
    const initializationVector = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', encryptionKey, initializationVector)
    const encrypted = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ])

    return [
      VERSION,
      encode(initializationVector),
      encode(encrypted),
      encode(cipher.getAuthTag()),
    ].join('.')
  }

  return Object.freeze({
    create(_purpose?: 'confirmation' | 'unsubscribe') {
      const plain = randomBytes(32).toString('base64url')

      return Object.freeze({
        encrypted: encrypt(plain),
        hash: hash(plain),
        plain,
      })
    },
    decrypt(envelope: string) {
      try {
        const [version, initializationVector, encrypted, authenticationTag, extra] =
          envelope.split('.')

        if (
          version !== VERSION ||
          !initializationVector ||
          !encrypted ||
          !authenticationTag ||
          extra
        ) {
          throw new Error('invalid envelope')
        }

        const decipher = createDecipheriv(
          'aes-256-gcm',
          encryptionKey,
          decode(initializationVector),
        )

        decipher.setAuthTag(decode(authenticationTag))

        return Buffer.concat([
          decipher.update(decode(encrypted)),
          decipher.final(),
        ]).toString('utf8')
      } catch {
        throw new Error('ENGAGEMENT_TOKEN_INVALID')
      }
    },
    encrypt,
    hash,
  })
}
