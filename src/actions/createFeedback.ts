"use server"

import { Feedback } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { db } from "@/lib/db"

import { creatorMiddleware } from "./utils"

const SchemaCreateFeedback = z.object({
  receiverId: z.string(),
  senderId: z.string().optional(),
  status: z.enum(['PAID', 'PENDING', 'FAILED']).optional(),
});

type ActionCreateFeedback = {
  message: string,
  receiverId: string,
  senderId: string
}
export async function createFeedback(passedData: ActionCreateFeedback) {
  try {
    creatorMiddleware(passedData.senderId)
    const { message, receiverId, senderId } = passedData;

    const validatedFields = SchemaCreateFeedback.safeParse({
      message,
      receiverId,
      senderId,
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
        sender: { connect: { id: senderId } },
      }
    })
    revalidatePath(`/profile/${receiverId}`);
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
  redirect(`/profile/${passedData.receiverId}`);
}

type ActionUpdateFeedback = {
  id: string,
  status: Feedback['status'],
  senderId: string,
}
export async function removeFeedback(passedData: ActionRemoveFeedback) {
  try {
    const { id, senderId } = passedData;
    creatorMiddleware(senderId)
    const feedback = await db.feedback.findUnique({ where: { id } });
    if (!feedback) return { message: 'Feedback not found.' };

    await db.feedback.delete({ where: { id } })
    revalidatePath(`/profile/${senderId}`);
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
  redirect(`/profile/${passedData.senderId}`);
}

type ActionRemoveFeedback = {
  id: string,
  senderId: string,
}
export async function updateFeedback(passedData: ActionUpdateFeedback) {
  try {
    const { id, status, senderId } = passedData;
    creatorMiddleware(senderId)
    const feedback = await db.feedback.findUnique({ where: { id } });
    if (!feedback) return { message: 'Feedback not found.' };

    await db.feedback.update({
      where: { id },
      data: { status },
    })
    revalidatePath(`/profile/${senderId}`);
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
  redirect(`/profile/${passedData.senderId}`);
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
//     console.log(error)
//     return error
//   }
//   redirect(`/profile/${feedback.receiverId}`);
// }