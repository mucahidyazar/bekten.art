"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { db } from "@/lib/db"


type ActionRemoveUser = {
  id: string,
}
export async function removeUser(passedData: ActionRemoveUser) {
  try {
    const { id } = passedData;
    // creatorMiddleware(senderId)
    const user = await db.user.findUnique({ where: { id } });
    if (!user) return { message: 'User not found.' };

    await db.user.delete({ where: { id } })

    revalidatePath(`/profile/${id}`);
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
  redirect('/');
}
