'use client'

import {useActionState} from 'react'

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
  type: 'AVAILABILITY' | 'COMMISSION' | 'GENERAL' | 'PRIVATE_VIEWING'
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
  'mt-2 min-h-11 w-full border border-stone-500/70 bg-[#fffaf0] px-3 py-2 outline-none focus-visible:border-red-900 focus-visible:ring-2 focus-visible:ring-red-900/20'

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
      <p className="text-xs font-semibold tracking-[0.2em] text-red-900 uppercase">
        {inquiry.type.replaceAll('_', ' ')} · {inquiry.locale.toUpperCase()}
      </p>
      <h1
        className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl"
        id="inquiry-detail-title"
      >
        {inquiry.name}
      </h1>
      <p className="mt-3 text-sm text-stone-600">
        Received {inquiry.createdAt.slice(0, 10)}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <section aria-labelledby="collector-message-title">
            <h2 className="font-serif text-2xl" id="collector-message-title">
              Collector request
            </h2>
            <dl className="mt-5 grid gap-4 border-y border-stone-400/60 py-5 sm:grid-cols-2">
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
          </section>

          <section aria-labelledby="private-notes-title">
            <h2 className="font-serif text-2xl" id="private-notes-title">
              Private notes
            </h2>
            {notes.length === 0 ? (
              <p className="mt-4 text-stone-600">No private notes yet.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {notes.map(note => (
                  <li
                    className="border-l-2 border-stone-400 bg-white/30 p-4"
                    key={note.id}
                  >
                    <p className="leading-7 whitespace-pre-wrap">{note.body}</p>
                    <p className="mt-2 text-xs text-stone-600">
                      {note.author} ·{' '}
                      {note.createdAt.slice(0, 16).replace('T', ' ')}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <form
          action={formAction}
          className="h-fit border border-stone-400/60 bg-[#f8f2e6] p-5"
        >
          <h2 className="font-serif text-2xl">Inbox workflow</h2>
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
            <input
              className={fieldClassName}
              defaultValue={inquiry.labels.join(', ')}
              name="labels"
              placeholder="priority, private-viewing"
            />
          </label>
          <label className="mt-5 block">
            <span className="text-sm font-semibold">Add private note</span>
            <textarea
              className={fieldClassName}
              maxLength={10_000}
              name="note"
              rows={6}
            />
          </label>
          <button
            className="mt-5 min-h-11 w-full bg-stone-950 px-5 py-3 font-semibold text-white disabled:opacity-50"
            disabled={pending}
            type="submit"
          >
            {pending ? 'Saving…' : 'Save inquiry'}
          </button>
        </form>
      </div>
    </section>
  )
}

export type {StudioInquiryDetailValue, StudioInquiryNote}
