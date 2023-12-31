'use client'

import {Feedback, User} from '@prisma/client'
import {CheckIcon, TrashIcon} from 'lucide-react'
import Image from 'next/image'

import {removeFeedback, updateFeedback} from '@/actions'
import {useServerAction} from '@/hooks/useServerAction'
import {cn, formatDate} from '@/utils'

import {Button} from '../ui/button'

type FeedbackItemProps = {
  feedback: Feedback & {
    sender: User
  }
}
export function FeedbackItem({feedback}: FeedbackItemProps) {
  const [removeFeedbackAction, removeFeedbackIsPending] =
    useServerAction(removeFeedback)
  const [updateFeedbackAction, updateFeedbackIsPending] =
    useServerAction(updateFeedback)

  return (
    <li className={cn('relative flex gap-2 px-4 py-2')} key={feedback.id}>
      <Image
        src={feedback.sender?.image || ''}
        alt="Picture of the feedback"
        width={200}
        height={300}
        className="h-12 w-12 min-w-[3rem] rounded object-cover"
      />
      <div>
        <div className="mb-2 flex h-12 flex-col justify-center">
          <h4 className="font-semibold">{feedback.sender?.name}</h4>
          <h5 className="text-xs text-gray-500">
            {formatDate('DD/MM/YYYY', feedback.createdAt)}
          </h5>
        </div>
        <p className="text-xs">{feedback.message}</p>
      </div>
      {feedback.status === 'IN_PROGRESS' && (
        <div className="absolute inset-0 bg-gray-200 opacity-50" />
      )}
      <div className="absolute right-2 top-2 flex items-center gap-1">
        <Button
          size="icon"
          className="h-6 w-6 rounded text-red-700"
          variant="outline"
          onClick={() => {
            removeFeedbackAction({
              id: feedback.id,
            })
          }}
          isLoading={removeFeedbackIsPending}
          disabled={removeFeedbackIsPending}
        >
          <TrashIcon size={12} />
        </Button>
        {feedback.status === 'IN_PROGRESS' && (
          <Button
            size="icon"
            className="h-6 w-6 rounded text-green-700"
            variant="outline"
            onClick={() => {
              updateFeedbackAction({
                id: feedback.id,
                status: 'ACCEPTED',
              })
            }}
            isLoading={updateFeedbackIsPending}
            disabled={updateFeedbackIsPending}
          >
            <CheckIcon size={12} />
          </Button>
        )}
      </div>
    </li>
  )
}
