"use server"

import { Feedback } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { db } from "@/lib/db"

import { creatorMiddleware } from "./utils"

const SchemaCreateFeedback = z.object({
  receiverId: z.string(),
  status: z.enum(['PAID', 'PENDING', 'FAILED']).optional(),
});

type ActionCreateFeedback = {
  message: string,
  receiverId: string,
}
export async function createFeedback(passedData: ActionCreateFeedback) {
  const user = await creatorMiddleware()

  const { message, receiverId } = passedData;
  const validatedFields = SchemaCreateFeedback.safeParse({
    message,
    receiverId
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  await db.feedback.create({
    data: {
      message,
      receiver: { connect: { id: receiverId } },
      sender: { connect: { id: user.id } },
    }
  })
  await revalidatePath(`/profile/${receiverId}`);
  await redirect(`/profile/${passedData.receiverId}`);
}

type ActionUpdateFeedback = {
  id: string,
  status: Feedback['status'],
}
export async function removeFeedback(passedData: ActionRemoveFeedback) {
  await creatorMiddleware()

  const { id } = passedData;
  const feedback = await db.feedback.findUnique({ where: { id } });
  if (!feedback) return { message: 'Feedback not found.' };

  await db.feedback.delete({ where: { id } })
  await revalidatePath(`/profile/${feedback.receiverId}`);
  await redirect(`/profile/${feedback.receiverId}`);
}

type ActionRemoveFeedback = {
  id: string,
}
export async function updateFeedback(passedData: ActionUpdateFeedback) {
  const user = await creatorMiddleware()

  const { id, status } = passedData;
  const feedback = await db.feedback.findUnique({ where: { id } });
  if (!feedback) return { message: 'Feedback not found.' };

  await db.feedback.update({
    where: { id },
    data: { status },
  })
  await revalidatePath(`/profile/${user.id}`);
  await redirect(`/profile/${feedback.receiverId}`);
}
