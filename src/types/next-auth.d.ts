import type {DefaultSession} from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role?: 'USER' | 'ARTIST' | 'ADMIN'
    }
  }

  interface User {
    role?: 'USER' | 'ARTIST' | 'ADMIN'
    passwordResetRequired?: boolean
  }
}
