'use client'

import {useRouter} from 'next/navigation'
import {signOut} from 'next-auth/react'

import {Button} from '@/components/ui/button'

export function SignOutButton() {
  const router = useRouter()

  return (
    <Button
      onClick={async () => {
        signOut()
        router.push('/')
      }}
    >
      Sign out
    </Button>
  )
}
