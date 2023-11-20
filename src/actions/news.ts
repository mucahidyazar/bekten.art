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
    const user = await creatorMiddleware()

    const {
      title = '',
      date,
      subtitle = '',
      image = '',
      location = '',
      address = '',
      description = '',
      note = '',
    } = passedData as ActionCreateNews;

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
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',
      };
    }

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
        user: { connect: { id: user.id } },
      }
    })
    await revalidatePath('/news');
    await redirect('/news');
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
      error,
    };
  }
}

type ActionRemoveNews = {
  id: string,
}
export async function removeNews(passedData: ActionRemoveNews) {
  try {
    await creatorMiddleware()

    const { id } = passedData;
    const news = await db.news.findUnique({ where: { id } });
    if (!news) return { message: 'News not found.' };

    await db.news.delete({ where: { id } })
    await revalidatePath('/news');
    await redirect('/news');
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
      error
    };
  }
}
