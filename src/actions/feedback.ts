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
  try {
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
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
}

type ActionUpdateFeedback = {
  id: string,
  status: Feedback['status'],
}
export async function removeFeedback(passedData: ActionRemoveFeedback) {
  try {
    await creatorMiddleware()

    const { id } = passedData;
    const feedback = await db.feedback.findUnique({ where: { id } });
    if (!feedback) return { message: 'Feedback not found.' };

    await db.feedback.delete({ where: { id } })
    await revalidatePath(`/profile/${feedback.receiverId}`);
    await redirect(`/profile/${feedback.receiverId}`);
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
}

type ActionRemoveFeedback = {
  id: string,
}
export async function updateFeedback(passedData: ActionUpdateFeedback) {
  try {
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
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
}

// or without form
// type Feedback = {
//   message: string
//   senderId: string
//   receiverId: string
// }
// async function createFeedback(feedback: Feedback) {
//   try {
//     creatorMiddleware(feedback.senderId)
//     await db.feedback.create({
//       data: {
//         message: feedback.message,
//         sender: { connect: { id: feedback.senderId } },
//         receiver: { connect: { id: feedback.receiverId } },
//       },
//     })
//     revalidatePath(`/profile/${feedback.receiverId}`);
//   } catch (error) {
//     return error
//   }
//   redirect(`/profile/${feedback.receiverId}`);
// }