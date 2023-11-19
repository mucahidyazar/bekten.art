"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { db } from "@/lib/db"

import { creatorMiddleware } from "./utils"

const SchemaCreatePress = z.object({
  title: z.string(),
  link: z.string(),
});

type ActionCreatePress = {
  userId: string,
  title: string,
  link: string,
}
export async function createPress(passedData: ActionCreatePress) {
  try {
    const { title = '', link = '', userId = '' } = passedData as ActionCreatePress;
    creatorMiddleware(userId)

    const validatedFields1 = SchemaCreatePress.safeParse({
      title,
      link,
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!(validatedFields1.success)) {
      return {
        errors: validatedFields1.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',
      };
    }
    console.log({
      title,
      link,
      userId,
    })

    await db.press.create({
      data: {
        title,
        link,
        user: { connect: { id: userId } },
      }
    })
    revalidatePath('/news');
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
  redirect('/news');
}

type ActionRemovePress = {
  id: string,
  userId: string,
}
export async function removePress(passedData: ActionRemovePress) {
  try {
    const { id, userId } = passedData;
    creatorMiddleware(userId)
    const press = await db.press.findUnique({ where: { id } });
    if (!press) return { message: 'Press not found.' };

    await db.press.delete({ where: { id } })
    revalidatePath('/news');
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
  redirect('/news');
}
