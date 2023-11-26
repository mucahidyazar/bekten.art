'use server'

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { db } from "../lib/db"

import { creatorMiddleware } from "./utils"

type CreateArtworkInput = {
  name: string,
  description: string,
  price: number,
  images: string[],
  nftLink: string,
  buyLink: string,
}
async function createArtwork(artwork: CreateArtworkInput) {
  const user = await creatorMiddleware()

  await db.artwork.create({
    data: {
      ...artwork,
      artist: { connect: { id: user.id } },
    }
  })
  await revalidatePath('/store');
  await redirect('/store');
}



export {
  createArtwork,
}
