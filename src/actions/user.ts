"use server"

export async function removeUser() {
  // TODO: Implement with Supabase
  console.log('User removal will be implemented with Supabase')
  return { message: 'User removal not implemented yet.' }
}

type SignUpUser = {
  email: string
  password: string
}

export async function signUpUser(user: SignUpUser) {
  // TODO: Implement with Supabase
  console.log('User signup will be implemented with Supabase', user)
  return { message: 'User signup not implemented yet.' }
}