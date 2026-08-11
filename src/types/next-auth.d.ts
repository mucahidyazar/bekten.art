import type {DefaultSession} from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role?: 'ADMIN' | 'EDITOR' | 'OWNER' | 'USER'
    }
  }

  interface User {
    role?: 'ADMIN' | 'EDITOR' | 'OWNER' | 'USER'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'ADMIN' | 'EDITOR' | 'OWNER' | 'USER'
  }
}
