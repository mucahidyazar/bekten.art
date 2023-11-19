"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { db } from "@/lib/db"

import { creatorMiddleware } from "./utils"

const SchemaCreateNews = z.object({
  title: z.string(),
  date: z.date(),
  subtitle: z.string().optional(),
  image: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  description: z.string(),
  note: z.string().optional(),
});

type ActionCreateNews = {
  userId: string,
  title: string,
  date: Date | null,
  subtitle: string,
  image: string,
  location?: string,
  address?: string,
  description: string,
  note: string,
}
export async function createNews(passedData: ActionCreateNews) {
  try {
    const {
      title = '',
      date,
      subtitle = '',
      image = '',
      location = '',
      address = '',
      description = '',
      note = '',
      userId = ''
    } = passedData as ActionCreateNews;
    creatorMiddleware(userId)

    const validatedFields = SchemaCreateNews.safeParse({
      title,
      date,
      subtitle,
      image,
      location,
      address,
      description,
      note,
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!(validatedFields.success)) {
      console.log('x1')
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',
      };
    }
    console.log('x2')

    await db.news.create({
      data: {
        title,
        date,
        subtitle,
        image,
        location,
        address,
        description,
        note,
        user: { connect: { id: userId } },
      }
    })
    console.log('x3')
    revalidatePath('/news');
  } catch (error) {
    console.log(error)
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
  redirect('/news');
}

type ActionRemoveNews = {
  id: string,
  userId: string,
}
export async function removeNews(passedData: ActionRemoveNews) {
  try {
    const { id, userId } = passedData;
    creatorMiddleware(userId)
    const news = await db.news.findUnique({ where: { id } });
    if (!news) return { message: 'News not found.' };

    await db.news.delete({ where: { id } })
    revalidatePath('/news');
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
  redirect('/news');
}
