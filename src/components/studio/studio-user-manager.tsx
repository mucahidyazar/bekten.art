'use client'

import {useRouter} from 'next/navigation'

import {MailPlus, RefreshCw, ShieldCheck, UserRoundX} from 'lucide-react'
import {useState} from 'react'

import {StudioPageHeader} from '@/components/studio/studio-dashboard-components'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ManagedStudioUser = Readonly<{
  acceptedAt: string | null
  createdAt: string
  email: string
  id: string
  invitedAt: string | null
  lastSignInAt: string | null
  name: string | null
  role: 'ADMIN' | 'EDITOR' | 'OWNER'
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED'
  suspendedAt: string | null
  version: number
}>

type StudioUserManagerProps = Readonly<{
  initialUsers: readonly ManagedStudioUser[]
}>

const statusLabels = {
  ACTIVE: 'Active',
  INVITED: 'Invited',
  SUSPENDED: 'Suspended',
} as const

async function safeError(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as {error?: unknown}

  return typeof payload.error === 'string'
    ? payload.error
    : 'Studio access could not be updated.'
}

function formatDate(value: string | null) {
  if (!value) return 'Never'

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export type {ManagedStudioUser}

export function StudioUserManager({initialUsers}: StudioUserManagerProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function command(body: Readonly<Record<string, unknown>>) {
    setPending(true)

    try {
      const response = await fetch('/api/dashboard/users', {
        body: JSON.stringify(body),
        headers: {'content-type': 'application/json'},
        method: 'POST',
      })

      if (!response.ok) {
        setMessage(await safeError(response))

        return false
      }

      setMessage('Studio access updated.')
      router.refresh()

      return true
    } catch {
      setMessage('Studio access is temporarily unavailable.')

      return false
    } finally {
      setPending(false)
    }
  }

  return (
    <section aria-labelledby="studio-users-title">
      <StudioPageHeader
        action={
          <Button onClick={() => setDialogOpen(true)} type="button">
            <MailPlus aria-hidden="true" className="size-4" />
            Invite user
          </Button>
        }
        description="Invite editors, assign owner access and revoke active sessions from one private workspace."
        eyebrow="Owner access"
        title="Users"
        titleId="studio-users-title"
      />

      <p aria-live="polite" className="mt-4 min-h-6 text-sm text-stone-700">
        {message}
      </p>

      <div className="mt-6 grid gap-3">
        {initialUsers.map(user => (
          <Card
            className="border-stone-500/30 bg-[#f7f1e6] shadow-none"
            key={user.id}
          >
            <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.3fr)_11rem_10rem_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">
                    {user.name || user.email}
                  </p>
                  <Badge variant="outline">{statusLabels[user.status]}</Badge>
                </div>
                <p className="mt-1 truncate text-sm text-stone-600">
                  {user.email}
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  Last sign-in: {formatDate(user.lastSignInAt)}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor={`role-${user.id}`}>
                  Role
                </Label>
                <Select
                  disabled={pending}
                  onValueChange={role =>
                    void command({
                      action: 'user.role',
                      id: user.id,
                      role,
                      version: user.version,
                    })
                  }
                  value={user.role === 'ADMIN' ? 'OWNER' : user.role}
                >
                  <SelectTrigger id={`role-${user.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EDITOR">Editor</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-stone-600">
                <p>Invited</p>
                <p className="mt-1 text-stone-900">
                  {formatDate(user.invitedAt ?? user.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                {user.status === 'INVITED' ? (
                  <Button
                    disabled={pending}
                    onClick={() =>
                      void command({action: 'user.resend-invite', id: user.id})
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <RefreshCw aria-hidden="true" className="size-4" />
                    Resend invite
                  </Button>
                ) : null}
                <Button
                  disabled={pending}
                  onClick={() =>
                    void command({
                      action: 'user.status',
                      id: user.id,
                      status:
                        user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED',
                      version: user.version,
                    })
                  }
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {user.status === 'SUSPENDED' ? (
                    <ShieldCheck aria-hidden="true" className="size-4" />
                  ) : (
                    <UserRoundX aria-hidden="true" className="size-4" />
                  )}
                  {user.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent className="border-stone-500/35 bg-[#f7f1e6]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              Invite to Bekten Studio
            </DialogTitle>
            <DialogDescription>
              A single-use sign-in link will be delivered through Resend.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault()
              const form = new FormData(event.currentTarget)

              void command({
                action: 'user.invite',
                email: String(form.get('email') ?? ''),
                name: String(form.get('name') ?? ''),
                role: String(form.get('role') ?? 'EDITOR'),
              }).then(success => success && setDialogOpen(false))
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="studio-user-email">Email address</Label>
                <Input
                  autoComplete="email"
                  id="studio-user-email"
                  name="email"
                  required
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-user-name">Display name</Label>
                <Input id="studio-user-name" maxLength={120} name="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-user-role">Role</Label>
                <select
                  className="h-10 w-full rounded-md border border-stone-500/35 bg-transparent px-3 text-sm"
                  defaultValue="EDITOR"
                  id="studio-user-role"
                  name="role"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button disabled={pending} type="submit">
                Send invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
