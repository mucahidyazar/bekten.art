import type {DefaultSession} from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      authenticatedAt?: number
      id: string
      passwordResetRequired?: boolean
      role?: 'USER' | 'ARTIST' | 'ADMIN'
    }
  }

  interface User {
    role?: 'USER' | 'ARTIST' | 'ADMIN'
    passwordResetRequired?: boolean
    sessionVersion?: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    authTime?: number
    passwordResetRequired?: boolean
    role?: 'USER' | 'ARTIST' | 'ADMIN'
    sessionVersion?: number
  }
}
