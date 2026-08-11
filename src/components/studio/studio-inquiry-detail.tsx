'use client'

import {useActionState} from 'react'

import {StudioPageHeader} from '@/components/studio/studio-dashboard-components'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'

import {INITIAL_STUDIO_ACTION_STATE} from './editorial-action-state'

import type {StudioActionState} from './editorial-action-state'

type StudioInquiryDetailValue = Readonly<{
  brief?: string | null
  createdAt: string
  email: string
  labels: readonly string[]
  locale: 'en' | 'ky' | 'ru' | 'tr'
  message?: string | null
  name: string
  phone: string | null
  preferredTimeline?: string | null
  relatedArtworkTitle: string | null
  status: 'ARCHIVED' | 'CLOSED' | 'IN_REVIEW' | 'NEW' | 'RESPONDED'
  subject?: string | null
  type:
    'AVAILABILITY' | 'COLLECTOR' | 'COMMISSION' | 'GENERAL' | 'PRIVATE_VIEWING'
}>

type StudioInquiryNote = Readonly<{
  author: string
  body: string
  createdAt: string
  id: string
}>

type StudioInquiryDetailProps = Readonly<{
  action: (
    state: StudioActionState,
    formData: FormData,
  ) => Promise<StudioActionState>
  inquiry: StudioInquiryDetailValue
  notes: readonly StudioInquiryNote[]
}>

const fieldClassName =
  'mt-2 min-h-11 w-full border-stone-500/45 bg-[#fffaf0] px-3 py-2 focus-visible:border-[#6f2a1a] focus-visible:ring-2 focus-visible:ring-[#6f2a1a]/25'

export function StudioInquiryDetail({
  action,
  inquiry,
  notes,
}: StudioInquiryDetailProps) {
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_STUDIO_ACTION_STATE,
  )

  return (
    <section aria-labelledby="inquiry-detail-title">
      <StudioPageHeader
        description={`Received ${inquiry.createdAt.slice(0, 10)}`}
        eyebrow={`${inquiry.type.replaceAll('_', ' ')} · ${inquiry.locale.toUpperCase()}`}
        title={inquiry.name}
        titleId="inquiry-detail-title"
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <Card className="border-stone-500/30 bg-[#f7f1e6] shadow-none">
            <CardHeader>
              <CardTitle
                className="font-serif text-2xl"
                id="collector-message-title"
              >
                Collector request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 border-y border-stone-400/40 py-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-stone-600">Email</dt>
                  <dd className="mt-1">
                    <a
                      className="font-semibold underline underline-offset-4"
                      href={`mailto:${inquiry.email}`}
                    >
                      {inquiry.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-600">Phone</dt>
                  <dd className="mt-1">{inquiry.phone ?? 'Not provided'}</dd>
                </div>
                {inquiry.relatedArtworkTitle ? (
                  <div>
                    <dt className="text-sm text-stone-600">Artwork</dt>
                    <dd className="mt-1 font-semibold">
                      {inquiry.relatedArtworkTitle}
                    </dd>
                  </div>
                ) : null}
                {inquiry.preferredTimeline ? (
                  <div>
                    <dt className="text-sm text-stone-600">Timeline</dt>
                    <dd className="mt-1">{inquiry.preferredTimeline}</dd>
                  </div>
                ) : null}
              </dl>
              {inquiry.subject ? (
                <h3 className="mt-6 font-semibold">{inquiry.subject}</h3>
              ) : null}
              {inquiry.brief ? (
                <p className="mt-4 leading-7 whitespace-pre-wrap">
                  {inquiry.brief}
                </p>
              ) : null}
              {inquiry.message ? (
                <p className="mt-4 leading-7 whitespace-pre-wrap">
                  {inquiry.message}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <section aria-labelledby="private-notes-title">
            <h2 className="font-serif text-2xl" id="private-notes-title">
              Private notes
            </h2>
            {notes.length === 0 ? (
              <p className="mt-4 text-stone-600">No private notes yet.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {notes.map(note => (
                  <li key={note.id}>
                    <Card className="border-stone-500/30 bg-[#f7f1e6] shadow-none">
                      <CardContent className="p-4">
                        <p className="leading-7 whitespace-pre-wrap">
                          {note.body}
                        </p>
                        <p className="mt-2 text-xs text-stone-600">
                          {note.author} ·{' '}
                          {note.createdAt.slice(0, 16).replace('T', ' ')}
                        </p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <Card className="h-fit border-stone-500/30 bg-[#f7f1e6] shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="font-serif text-2xl">
                Inbox workflow
              </CardTitle>
              <Badge
                className="border-[#9a7b42]/45 bg-[#e7dcc6] text-stone-800"
                variant="outline"
              >
                {inquiry.status.replaceAll('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form action={formAction}>
              {state.status === 'error' ? (
                <p className="mt-4 text-sm text-red-900" role="alert">
                  {state.message}
                </p>
              ) : null}
              <label className="mt-5 block">
                <span className="text-sm font-semibold">Inquiry status</span>
                <select
                  className={fieldClassName}
                  defaultValue={inquiry.status}
                  name="status"
                >
                  <option value="NEW">New</option>
                  <option value="IN_REVIEW">In review</option>
                  <option value="RESPONDED">Responded</option>
                  <option value="CLOSED">Closed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>
              <label className="mt-5 block">
                <span className="text-sm font-semibold">Labels</span>
                <Input
                  className={fieldClassName}
                  defaultValue={inquiry.labels.join(', ')}
                  name="labels"
                  placeholder="priority, private-viewing"
                />
              </label>
              <label className="mt-5 block">
                <span className="text-sm font-semibold">Add private note</span>
                <Textarea
                  className={fieldClassName}
                  maxLength={10_000}
                  name="note"
                  rows={6}
                />
              </label>
              <Button
                className="mt-5 min-h-11 w-full bg-[#6f2a1a] text-[#fffaf0] hover:bg-[#542014]"
                disabled={pending}
                isLoading={pending}
                size="lg"
                type="submit"
              >
                {pending ? 'Saving…' : 'Save inquiry'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export type {StudioInquiryDetailValue, StudioInquiryNote}
