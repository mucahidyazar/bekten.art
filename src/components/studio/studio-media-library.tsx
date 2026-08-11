'use client'

import Image from 'next/image'
import {useRouter} from 'next/navigation'

import {useState} from 'react'

type StudioMediaItem = Readonly<{
  createdAt: string
  filename: string
  height: number | null
  id: string
  sizeBytes: number
  status: 'FAILED' | 'QUARANTINED' | 'READY'
  width: number | null
}>

type StudioMediaLibraryProps = Readonly<{
  canDelete: boolean
  initialMedia: readonly StudioMediaItem[]
}>

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/avif'
const acceptedImageTypes = new Set(ACCEPTED_IMAGE_TYPES.split(','))
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

function isFile(value: FormDataEntryValue | null): value is File {
  return (
    value !== null &&
    typeof value !== 'string' &&
    typeof value.name === 'string' &&
    Number.isSafeInteger(value.size) &&
    typeof value.type === 'string'
  )
}

async function safeError(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as {error?: unknown}

  return typeof payload.error === 'string'
    ? payload.error
    : 'The media request could not be completed.'
}

export type {StudioMediaItem}

export function StudioMediaLibrary({
  canDelete,
  initialMedia,
}: StudioMediaLibraryProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fileInput = form.elements.namedItem('file') as HTMLInputElement | null
    const file = fileInput?.files?.[0] ?? null

    if (!isFile(file) || file.size === 0) {
      setMessage('Choose an image before uploading.')

      return
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setMessage('Images must be 12 MB or smaller.')

      return
    }

    if (!acceptedImageTypes.has(file.type)) {
      setMessage('Only JPEG, PNG, WebP and AVIF images are accepted.')

      return
    }

    setPending(true)
    setMessage('Uploading image…')
    const formData = new FormData()

    formData.set('file', file)
    formData.set('bucket', 'images')
    formData.set('folder', 'editorial')

    try {
      const response = await fetch('/api/uploads', {
        body: formData,
        method: 'POST',
      })

      if (!response.ok) {
        setMessage(await safeError(response))

        return
      }

      form.reset()
      setMessage('Image uploaded to Garage.')
      router.refresh()
    } catch {
      setMessage('The upload service is temporarily unavailable.')
    } finally {
      setPending(false)
    }
  }

  async function deleteMedia(id: string) {
    setPending(true)
    setMessage('Deleting image…')

    try {
      const response = await fetch(
        `/api/uploads?id=${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
        },
      )

      if (!response.ok) {
        setMessage(await safeError(response))

        return
      }

      setMessage('Image deleted from Garage.')
      router.refresh()
    } catch {
      setMessage('The delete service is temporarily unavailable.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section aria-labelledby="media-library-title">
      <p className="text-xs font-semibold tracking-[0.2em] text-red-900 uppercase">
        Garage media
      </p>
      <h1
        className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl"
        id="media-library-title"
      >
        Media library
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-stone-700">
        Upload transformed editorial images, then attach them to content with a
        role and meaningful alternative text.
      </p>

      <form
        className="mt-8 flex flex-wrap items-end gap-4 border-y border-stone-400/60 py-6"
        onSubmit={upload}
      >
        <label className="min-w-64 flex-1">
          <span className="block text-sm font-semibold">
            Choose artwork image
          </span>
          <input
            accept={ACCEPTED_IMAGE_TYPES}
            className="mt-2 min-h-11 w-full border border-stone-500 bg-[#fffaf0] p-2 file:mr-3 file:border-0 file:bg-stone-950 file:px-3 file:py-2 file:text-white"
            name="file"
            required
            type="file"
          />
        </label>
        <button
          className="min-h-11 bg-stone-950 px-5 py-3 font-semibold text-white disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          Upload image
        </button>
      </form>
      <p aria-live="polite" className="mt-3 min-h-6 text-sm text-stone-700">
        {message}
      </p>

      {initialMedia.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-500/60 bg-white/30 p-8">
          <h2 className="font-serif text-2xl">No editorial media yet.</h2>
          <p className="mt-2 leading-7 text-stone-700">
            Upload the first real image to begin the visual archive.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {initialMedia.map(item => (
            <li
              className="border border-stone-400/60 bg-[#f8f2e6] p-3"
              key={item.id}
            >
              {item.status === 'READY' ? (
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
                  <Image
                    alt={item.filename}
                    className="object-contain"
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 640px) 45vw, 90vw"
                    src={`/api/media/${item.id}`}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-red-900/40 bg-red-50 p-6 text-center text-sm font-semibold text-red-950">
                  {item.status === 'FAILED'
                    ? 'Deletion needs attention'
                    : 'Media quarantined for review'}
                </div>
              )}
              <p className="mt-3 truncate font-semibold">{item.filename}</p>
              <p className="mt-1 text-xs text-stone-600">
                {item.width ?? '—'} × {item.height ?? '—'} ·{' '}
                {Math.ceil(item.sizeBytes / 1024)} KB
              </p>
              {canDelete ? (
                <button
                  className="mt-3 min-h-11 text-sm font-semibold text-red-900 underline underline-offset-4 disabled:opacity-50"
                  disabled={pending}
                  onClick={() => deleteMedia(item.id)}
                  type="button"
                >
                  {item.status === 'READY' ? 'Delete' : 'Retry deletion'}{' '}
                  {item.filename}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
