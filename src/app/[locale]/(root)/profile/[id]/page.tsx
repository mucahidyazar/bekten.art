import {Social} from '@prisma/client'
import {redirect} from 'next/navigation'

import {ProfileCard} from '@/components/molecules/ProfileCard'
import {SignOutButton} from '@/components/molecules/SignOutButton'
import {db} from '@/lib/db'

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
  if (!params.id) {
    return redirect('/')
  }

  const userDetail = await getUserDetail({id: params.id})
  if (!userDetail?.id) {
    return redirect('/')
  }

  const socials = [
    {
      id: userDetail.id,
      platform: 'email',
      url: userDetail.email as string,
    },
  ]

  userDetail?.socials.forEach(social => {
    if (social.platform !== socials[0].platform) {
      socials.push({
        id: social.id,
        platform: social.platform,
        url: social.url,
      })
    }
  })

  const userData = {
    ...userDetail,
    socials: socials as Social[],
  }

  return (
    <section className="mx-auto flex w-full flex-col gap-2 sm:w-80">
      <ProfileCard user={userData} />
      <SignOutButton />
    </section>
  )
}
