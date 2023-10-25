import Image from 'next/image'
import {redirect} from 'next/navigation'

import {SignOutButton} from '@/components/molecules/SignOutButton'
import {getCurrentUser} from '@/lib/session'

export default async function Page() {
  const user = await getCurrentUser()

  if (!user) {
    return redirect('/sign-in')
  }

  return (
    <section className="mx-auto mt-[20%] flex w-full flex-col gap-2 sm:w-80">
      <aside className="flex flex-col items-center gap-2">
        <Image
          src={user?.image || ''}
          width={100}
          height={100}
          alt="user avatar"
        />
        <p>{user?.name}</p>
      </aside>
      <SignOutButton />
    </section>
  )
}
