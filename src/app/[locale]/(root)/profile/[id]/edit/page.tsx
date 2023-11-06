import {Social, User} from '@prisma/client'
import {redirect} from 'next/navigation'

import {SignOutButton} from '@/components/molecules/SignOutButton'
import {ProfileForm} from '@/components/organisms/ProfileForm'
import {db} from '@/lib/db'
import {getCurrentUser} from '@/lib/session'

type GetUserDetailArgs = {
  id: string
}
const getUserDetail = async ({id}: GetUserDetailArgs) => {
  return await db.user.findUnique({
    where: {id},
    include: {socials: true},
  })
}

type PageProps = {
  params: {id: string}
}
export default async function Page({params}: PageProps) {
  const user = await getCurrentUser()

  if (!user) {
    return redirect('/sign-in')
  }

  const isAdmin = user.role === 'ADMIN'
  if (!isAdmin && user.id !== params.id) {
    return redirect(`/profile/${user?.id}`)
  }

  const userDetail = await getUserDetail({id: params.id})

  return (
    <section className="mx-auto flex w-full flex-col gap-2 sm:w-80">
      <ProfileForm userDetail={userDetail as User & {socials: Social[]}} />
      <SignOutButton />
    </section>
  )
}
