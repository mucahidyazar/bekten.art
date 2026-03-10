import { Button } from '@/components/ui/button'
import { signOutUser } from '@/lib/auth-actions'

export function SignOutButton() {
  return (
    <form action={signOutUser}>
      <Button
        type="submit"
        variant="outline"
        className="w-full"
      >
        Sign Out
      </Button>
    </form>
  )
}
