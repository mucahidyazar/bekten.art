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