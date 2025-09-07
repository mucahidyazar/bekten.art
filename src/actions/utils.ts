'use server'

import { CREATOR_ROLES } from "@/constants"

type User = {
  id: string
  email: string
  role: string
}

async function creatorMiddleware(): Promise<User> {
  try {
    const user = await userMiddleware();

    if (!CREATOR_ROLES.includes(user?.role as string)) {
      throw new Error('User not authorized')
    }

    return user
  } catch (error) {
    throw error
  }
}

async function userMiddleware(): Promise<User> {
  try {
    // TODO: Implement with Supabase
    throw new Error('User authentication not implemented yet')
  } catch (error) {
    throw error
  }
}

export { creatorMiddleware, userMiddleware }
