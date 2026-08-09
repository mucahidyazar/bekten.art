export type UiUser = Readonly<{
  email: string | null
  id: string
  image: string | null
  isAdmin: boolean
  name: string | null
  role: 'ADMIN' | 'ARTIST' | 'USER'
}>
