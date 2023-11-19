'use client'
import {zodResolver} from '@hookform/resolvers/zod'
import {SendIcon} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {useForm} from 'react-hook-form'
import {z} from 'zod'

import {createFeedback} from '@/actions'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'

type CreateFeedbackForm = {
  message: string
}

type CreateFeedbackProps = {
  senderId: string
  receiverId: string
  image: string
}
export default function CreateFeedback({
  senderId,
  receiverId,
  image,
}: CreateFeedbackProps) {
  const validationSchema = z.object({
    message: z.string().min(4).max(500),
  })
  const {
    formState: {errors},
    register,
    reset,
    handleSubmit,
  } = useForm<CreateFeedbackForm>({
    defaultValues: {
      message: '',
    },
    resolver: zodResolver(validationSchema),
  })

  return (
    <form
      className="relative flex flex-col gap-2 rounded-b py-4"
      onSubmit={handleSubmit(data => {
        createFeedback({
          senderId,
          receiverId,
          message: data.message,
        })
        reset()
      })}
    >
      <div className="flex w-full gap-2 px-4">
        <Image
          src={image || '/img/art/art-1.png'}
          alt="Picture of the author"
          width={200}
          height={300}
          className="h-12 w-12 min-w-[3rem] rounded object-cover"
        />
        <div className="flex-grow">
          <Textarea
            placeholder="Type your message here."
            className="h-12 rounded-sm border-none bg-transparent p-0 outline-none focus-visible:shadow-none focus-visible:outline-none focus-visible:ring-0"
            style={{boxShadow: 'none'}}
            rows={2}
            {...register('message', {required: true})}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-red-500">
              {errors.message.message}
            </p>
          )}
        </div>
      </div>
      <Button
        className="group absolute right-4 top-4 flex items-center gap-2 text-foreground"
        variant="link"
        size="sm"
        type="submit"
      >
        {/* <p>Send</p> */}
        <SendIcon className="h-4 w-4" />
      </Button>
      {!senderId && (
        <Link
          href="/sign-in"
          className="absolute inset-0 flex items-center justify-center rounded bg-gray-500 bg-opacity-80 text-sm hover:underline"
        >
          You must be logged in to send feedback.
        </Link>
      )}
    </form>
  )
}
