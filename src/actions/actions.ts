'use server'


import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { db } from "../lib/db"

const creatorRoles = ['ADMIN', 'ARTIST']
async function creatorMiddleware(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      throw new Error('User not found')
    }
    if (!creatorRoles.includes(user.role)) {
      throw new Error('User not authorized')
    }
  } catch (error) {
    return error
  }
}
async function createArtwork(artwork: any) {
  try {
    creatorMiddleware(artwork.artistId)
    const data = JSON.parse(JSON.stringify(artwork))
    await db.artwork.create({
      data,
    })
    revalidatePath('/store');
  } catch (error) {
    console.log(error)
    return error
  }
  redirect('/store');
}

async function updatePermission(userId: string, updates: any) {
  try {
    creatorMiddleware(userId)
    // updates has also socials value of Social model inside the user
    // update them also too
    const data = JSON.parse(JSON.stringify(updates))
    await db.user.update({
      data, where: { id: userId }
    })
    revalidatePath(`/profile/${userId}`);
  } catch (error) {
    console.log(error)
    return error
  }
  redirect(`/profile/${userId}`);
}

async function updateUser(userId: string, updates: any) {
  try {
    creatorMiddleware(userId)

    // updates has also socials value of Social model inside the user
    // update them also too
    const data = JSON.parse(JSON.stringify(updates))
    await db.user.update({
      data: {
        ...data,
        socials: {
          deleteMany: {},
          create: data.socials
        }
      }, where: { id: userId }
    })
    revalidatePath(`/profile/${userId}`);
  } catch (error) {
    console.log(error)
    return error
  }
  redirect(`/profile/${userId}`);
}

export {
  createArtwork,
  updatePermission,
  updateUser,
}
