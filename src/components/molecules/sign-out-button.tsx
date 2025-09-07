import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth-actions'

export function SignOutButton() {
  return (
    <form action={signOut}>
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
