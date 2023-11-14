'use server'
import { CREATOR_ROLES } from "@/constants"

import { db } from "../lib/db"

async function creatorMiddleware(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      throw new Error('User not found')
    }
    if (!CREATOR_ROLES.includes(user.role)) {
      throw new Error('User not authorized')
    }
  } catch (error) {
    return error
  }
}

export { creatorMiddleware }
