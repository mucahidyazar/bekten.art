'use client'
import {Press} from '@prisma/client'
import {TrashIcon} from 'lucide-react'
import {useSession} from 'next-auth/react'

import {removePress} from '@/actions'

import {PressListHeader} from './PressListHeader'

type PressListProps = {
  pressList: (Press & {link: string})[]
}
export function PressList({pressList}: PressListProps) {
  const session = useSession()

  return (
    <section>
      <PressListHeader />
      {!!pressList.length && (
        <ul className="press-links max-h-40 list-inside list-disc overflow-auto rounded bg-primary-500 bg-opacity-10 p-2 text-xs">
          {pressList.map(press => (
            <li
              key={press.id}
              className="flex items-center justify-between rounded-sm px-2 py-1 text-gray-500 hover:bg-primary-500 hover:bg-opacity-5 hover:text-gray-700 hover:underline"
            >
              <a href={press.link} target="_blank" className="pl-1">
                {press.title}
              </a>
              <div className="flex items-center gap-2">
                {/* <PencilIcon className="inline h-3 w-3 cursor-pointer text-gray-500 hover:scale-110 hover:text-primary-500" /> */}
                {session.data?.user.role === 'ADMIN' && (
                  <TrashIcon
                    className="inline h-3 w-3 cursor-pointer text-gray-500 hover:scale-110 hover:text-primary-500"
                    onClick={() => {
                      removePress({id: press.id})
                    }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
