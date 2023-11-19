'use client'
import {useSession} from 'next-auth/react'
import {useState} from 'react'

import CreatePress from '../forms/create-press'
import {Button} from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'

export function PressListHeader() {
  const session = useSession()
  const [open, setOpen] = useState(false)

  const onRequestClose = () => setOpen(false)

  return (
    <aside className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-primary-500">Press</h3>
        {session.data?.user.role === 'ADMIN' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="link"
                className="h-6 text-xs text-primary-500"
              >
                Add Press
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Press</DialogTitle>
                <DialogDescription>
                  Add a link to a press link about you.
                </DialogDescription>
              </DialogHeader>
              <CreatePress onRequestClose={onRequestClose} />
            </DialogContent>
          </Dialog>
        )}
      </div>
      <p className="text-xs text-primary-500 text-opacity-60">
        It is the section you will find the press links about Bekten Usubaliev
      </p>
    </aside>
  )
}
