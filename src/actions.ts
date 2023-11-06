'use server'


import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { db } from "./lib/db"

export async function createArtwork(artwork: any) {
  try {
    const data = JSON.parse(JSON.stringify(artwork))
    await db.artwork.create({ data })
    revalidatePath('/store');
  } catch (error) {
    console.log(error)
    return error
  }
  redirect('/store');
}

export async function updateUser(id: string, updates: any) {
  try {
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
      }, where: { id }
    })
    revalidatePath(`/profile/${id}`);
  } catch (error) {
    console.log(error)
    return error
  }
  redirect(`/profile/${id}`);
}