'use client'

// TODO: Define proper types with Supabase
type Feedback = {
  id: string
  message: string
  status: string
  createdAt: Date
  sender: User
}

type User = {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

type FeedbackItemProps = {
  feedback: Feedback
}

export function FeedbackItem({feedback}: FeedbackItemProps) {
  return (
    <div className="mx-auto flex h-40 w-full items-center justify-center rounded bg-gray-100 dark:bg-slate-950">
      <p className="text-sm text-gray-500">
        Feedback item will be implemented with Supabase. ID: {feedback?.id}
      </p>
    </div>
  )
}
