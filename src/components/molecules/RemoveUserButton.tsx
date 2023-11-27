'use client'

import {useRouter} from 'next/navigation'
import {signOut} from 'next-auth/react'

import {Button} from '@/components/ui/button'
import {useServerAction} from '@/hooks/useServerAction'

import {removeUser} from '../../actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog'

export function RemoveUserButton() {
  const [action, isPending] = useServerAction(removeUser)
  const router = useRouter()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          // size="icon"
          className="w-full"
          isLoading={isPending}
          disabled={isPending}
        >
          Remove User
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              await action(undefined, {
                onSuccess: async () => {
                  await signOut()
                  router.push('/')
                },
              })
            }}
            disabled={isPending}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
