import type {
  EmailConfig,
  EmailUserConfig,
} from 'next-auth/providers/email'

export function createStudioEmailProvider(
  options: Required<
    Pick<
      EmailUserConfig,
      | 'from'
      | 'maxAge'
      | 'normalizeIdentifier'
      | 'secret'
      | 'sendVerificationRequest'
    >
  >,
): EmailConfig {
  return {
    from: options.from,
    id: 'email',
    maxAge: options.maxAge,
    name: 'Email',
    normalizeIdentifier: options.normalizeIdentifier,
    options,
    secret: options.secret,
    sendVerificationRequest: options.sendVerificationRequest,
    server: 'smtp://localhost:25',
    type: 'email',
  }
}
