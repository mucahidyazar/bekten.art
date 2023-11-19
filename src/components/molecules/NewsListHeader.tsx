'use client'
import {useSession} from 'next-auth/react'
import {useState} from 'react'

import CreateNews from '../forms/create-news'
import {Button} from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'

export function NewsListHeader() {
  const [open, setOpen] = useState(false)
  const session = useSession()

  const onRequestClose = () => setOpen(false)

  return (
    <aside className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-primary-500">News</h3>
        {session.data?.user.role === 'ADMIN' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="link"
                className="h-6 text-xs text-primary-500"
              >
                Add News
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add News</DialogTitle>
                <DialogDescription>
                  Add a link to a News link about you.
                </DialogDescription>
              </DialogHeader>
              <CreateNews onRequestClose={onRequestClose} />
            </DialogContent>
          </Dialog>
        )}
      </div>
      <p className="text-xs text-primary-500 text-opacity-60">
        It is the section you will find the news links about Bekten Usubaliev
      </p>
    </aside>
  )
}
