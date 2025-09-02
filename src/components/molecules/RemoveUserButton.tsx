'use client'

import {Button} from '@/components/ui/button'

export function RemoveUserButton() {
  const handleRemove = () => {
    // TODO: Implement with Supabase
    console.log('User removal will be implemented with Supabase')
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleRemove}
    >
      Remove Account
    </Button>
  )
}