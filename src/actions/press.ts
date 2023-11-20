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
  title: string,
  link: string,
}
export async function createPress(passedData: ActionCreatePress) {
  try {
    const user = await creatorMiddleware()
    await redirect(`/user/${user.id}`);

    const { title = '', link = '' } = passedData as ActionCreatePress;

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

    await db.press.create({
      data: {
        title,
        link,
        user: { connect: { id: user.id } },
      }
    })
    await revalidatePath('/news');
    await redirect('/news');
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
}

type ActionRemovePress = {
  id: string,
}
export async function removePress(passedData: ActionRemovePress) {
  try {
    await creatorMiddleware()

    const { id } = passedData;
    const press = await db.press.findUnique({ where: { id } });
    if (!press) return { message: 'Press not found.' };

    await db.press.delete({ where: { id } })
    await revalidatePath('/news');
    await redirect('/news');
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
}
