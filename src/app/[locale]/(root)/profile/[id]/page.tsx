import {Social} from '@prisma/client'
import {redirect} from 'next/navigation'

import CreateFeedbackForm from '@/components/forms/create-feedback-form'
import {FeedbackItem} from '@/components/molecules/feedback-item'
import {ProfileCard} from '@/components/molecules/ProfileCard'
import {SignOutButton} from '@/components/molecules/SignOutButton'
import {db} from '@/lib/db'
import {getCurrentUser} from '@/lib/session'
import {cn} from '@/utils'

type GetUserDetailArgs = {
  id: string
  includeInProgressFeedbacks: boolean
}
const getUserDetail = async ({
  id,
  includeInProgressFeedbacks,
}: GetUserDetailArgs) => {
  return await db.user.findUnique({
    where: {id},
    include: {
      socials: true,
      receiverFeedbacks: {
        include: {sender: true},
        where: includeInProgressFeedbacks ? {} : {status: 'ACCEPTED'},
      },
    },
  })
}

type PageProps = {
  params: {id: string}
}
export default async function Page({params}: PageProps) {
  const me = await getCurrentUser()
  if (!params.id) {
    return redirect('/')
  }

  const userDetail = await getUserDetail({
    id: params.id,
    includeInProgressFeedbacks: me?.id === params.id || me?.role === 'ADMIN',
  })
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
    <section className="mx-auto flex h-fit w-full flex-col gap-4 md:flex-row">
      <aside className="mx-auto flex w-full flex-col sm:w-80 sm:min-w-[20rem]">
        <ProfileCard
          user={userData}
          showPermissions
          className={cn(me?.id === params.id && 'rounded-b-none border-b-0')}
        />
        {me?.id === params.id && (
          <div className="flex items-center justify-center rounded-b border border-t-0 border-gray-200 p-4">
            <SignOutButton />
          </div>
        )}
      </aside>

      <aside className="flex h-fit flex-grow flex-col gap-4 rounded pt-4 text-foreground sm:pt-0">
        {userDetail.receiverFeedbacks.length ? (
          <ul className="flex flex-col gap-4">
            {userDetail.receiverFeedbacks.map(feedback => (
              <FeedbackItem feedback={feedback as any} key={feedback.id} />
            ))}
          </ul>
        ) : (
          <div className="mx-auto flex h-40 w-full items-center justify-center rounded bg-gray-100 dark:bg-slate-950">
            <p className="text-sm text-gray-500">
              This user has no feedback yet.
            </p>
          </div>
        )}

        <div className="mx-auto h-[1px] w-[calc(100%-2rem)] bg-foreground" />
        <CreateFeedbackForm
          senderId={me?.id as string}
          receiverId={params.id}
          image={me?.image as string}
        />
      </aside>
    </section>
  )
}
