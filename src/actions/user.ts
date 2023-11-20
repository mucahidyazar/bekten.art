"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"


export async function removeUser() {
  try {
    const user = await getCurrentUser()
    if (!user) return { message: 'User not found.' };

    const id = user.id;
    const dbUser = await db.user.findUnique({ where: { id } });
    if (!dbUser) return { message: 'User not found.' };

    await db.user.delete({ where: { id } })

    await revalidatePath(`/profile/${id}`);
    await redirect('/');
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
}


export async function updatePermission(updates: any) {
  try {
    const user = await getCurrentUser()
    if (!user) return { message: 'User not found.' };

    const id = user.id;
    const dbUser = await db.user.findUnique({ where: { id } });
    if (!dbUser) return { message: 'User not found.' };

    const data = JSON.parse(JSON.stringify(updates))
    await db.user.update({
      data, where: { id }
    })
    await revalidatePath(`/profile/${id}`);
    await redirect(`/profile/${id}`);
  } catch (error) {
    return error
  }
}

export async function updateUser(updates: any) {
  try {

    const user = await getCurrentUser()
    if (!user) return { message: 'User not found.' };

    const id = user.id;
    const dbUser = await db.user.findUnique({ where: { id } });
    if (!dbUser) return { message: 'User not found.' };

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
    await revalidatePath(`/profile/${id}`);
    await redirect(`/profile/${id}`);
  } catch (error) {
    return error
  }
}
