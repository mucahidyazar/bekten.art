'use client'

import Image from 'next/image'
import {useRouter} from 'next/navigation'

import {
  ChevronRight,
  Folder,
  FolderInput,
  FolderPlus,
  Grid2X2,
  ImageIcon,
  List,
  Monitor,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import {useEffect, useRef, useState} from 'react'
import {z} from 'zod'

import {
  StudioEmptyState,
  StudioPageHeader,
} from '@/components/studio/studio-dashboard-components'
import {Button} from '@/components/ui/button'
import {cn} from '@/utils'

import {
  StudioMediaDialogs,
  StudioMediaUploadSurface,
  StudioMediaViewButton,
} from './studio-media-library-controls'
import styles from './studio-media-library.module.css'

type StudioMediaItem = Readonly<{
  createdAt: string
  displayName: string
  filename: string
  folderId: string | null
  height: number | null
  id: string
  sizeBytes: number
  status: 'FAILED' | 'QUARANTINED' | 'READY'
  version: number
  width: number | null
}>

type StudioMediaFolder = Readonly<{
  id: string
  name: string
  parentId: string | null
  version: number
}>

type StudioMediaLibraryProps = Readonly<{
  canDelete: boolean
  initialFolders?: readonly StudioMediaFolder[]
  initialMedia: readonly StudioMediaItem[]
  initialMediaTotal?: number
  initialNextCursor?: string | null
}>

type MediaView = 'desktop' | 'grid' | 'list'
type MenuTarget = Readonly<{
  id: string
  kind: 'folder' | 'media'
  label: string
  version: number
  x: number
  y: number
}>

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/avif'
const acceptedImageTypes = new Set(ACCEPTED_IMAGE_TYPES.split(','))
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024
const mediaPageSchema = z
  .object({
    items: z.array(
      z
        .object({
          createdAt: z.iso.datetime(),
          displayName: z.string(),
          filename: z.string(),
          folderId: z.uuid().nullable(),
          height: z.number().int().positive().nullable(),
          id: z.uuid(),
          sizeBytes: z.number().int().nonnegative(),
          status: z.enum(['FAILED', 'QUARANTINED', 'READY']),
          version: z.number().int().positive(),
          width: z.number().int().positive().nullable(),
        })
        .strict(),
    ),
    nextCursor: z.uuid().nullable(),
    total: z.number().int().nonnegative(),
  })
  .strict()

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

function validatedFiles(files: readonly File[]) {
  if (files.length === 0) throw new Error('Choose an image before uploading.')

  for (const file of files) {
    if (!isFile(file) || file.size === 0) {
      throw new Error('Choose an image before uploading.')
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error('Images must be 12 MB or smaller.')
    }

    if (!acceptedImageTypes.has(file.type)) {
      throw new Error('Only JPEG, PNG, WebP and AVIF images are accepted.')
    }
  }

  return files
}

export type {StudioMediaFolder, StudioMediaItem}

export function StudioMediaLibrary({
  canDelete,
  initialFolders = [],
  initialMedia,
  initialMediaTotal = initialMedia.length,
  initialNextCursor = null,
}: StudioMediaLibraryProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [menuTarget, setMenuTarget] = useState<MenuTarget | null>(null)
  const [mediaItems, setMediaItems] =
    useState<readonly StudioMediaItem[]>(initialMedia)
  const [mediaTotal, setMediaTotal] = useState(initialMediaTotal)
  const [message, setMessage] = useState('')
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [moveTarget, setMoveTarget] = useState<MenuTarget | null>(null)
  const [nextCursor, setNextCursor] = useState(initialNextCursor)
  const [pending, setPending] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<MenuTarget | null>(null)
  const [view, setView] = useState<MediaView>('grid')

  const visibleFolders = initialFolders.filter(
    folder => folder.parentId === currentFolderId,
  )
  const visibleMedia = mediaItems.filter(
    media => media.folderId === currentFolderId,
  )
  const currentFolder = initialFolders.find(
    folder => folder.id === currentFolderId,
  )

  useEffect(() => {
    const dismiss = () => setMenuTarget(null)

    window.addEventListener('click', dismiss)

    return () => window.removeEventListener('click', dismiss)
  }, [])

  useEffect(() => {
    if (!menuTarget) return

    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [menuTarget])

  async function runCommand(body: Readonly<Record<string, unknown>>) {
    setPending(true)

    try {
      const response = await fetch('/api/dashboard/media-library', {
        body: JSON.stringify(body),
        headers: {'content-type': 'application/json'},
        method: 'POST',
      })

      if (!response.ok) {
        setMessage(await safeError(response))

        return false
      }

      router.refresh()

      return true
    } catch {
      setMessage('The media library is temporarily unavailable.')

      return false
    } finally {
      setPending(false)
    }
  }

  async function loadOlderMedia() {
    if (!nextCursor) return

    setPending(true)
    setMessage('Loading older images…')

    try {
      const response = await fetch(
        `/api/dashboard/media-library?cursor=${encodeURIComponent(nextCursor)}`,
        {headers: {accept: 'application/json'}},
      )

      if (!response.ok) {
        setMessage(await safeError(response))

        return
      }

      const page = mediaPageSchema.parse(await response.json())

      setMediaItems(current => {
        const existingIds = new Set(current.map(item => item.id))
        const additions = page.items.filter(item => !existingIds.has(item.id))

        return Object.freeze([...current, ...additions])
      })
      setMediaTotal(page.total)
      setNextCursor(page.nextCursor)
      setMessage(
        page.nextCursor
          ? 'Older images loaded.'
          : 'The complete media archive is visible.',
      )
    } catch {
      setMessage('Older images could not be loaded.')
    } finally {
      setPending(false)
    }
  }

  async function uploadFiles(files: readonly File[]) {
    let selected: readonly File[]

    try {
      selected = validatedFiles(files)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Invalid image.')

      return
    }

    setPending(true)
    setMessage(
      selected.length === 1
        ? 'Uploading image…'
        : `Uploading ${selected.length} images…`,
    )

    try {
      for (const file of selected) {
        const formData = new FormData()

        formData.set('file', file)
        formData.set('bucket', 'images')
        formData.set('folder', 'editorial')
        if (currentFolderId) formData.set('folderId', currentFolderId)

        const response = await fetch('/api/uploads', {
          body: formData,
          method: 'POST',
        })

        if (!response.ok) {
          setMessage(await safeError(response))

          return
        }
      }

      if (fileInputRef.current) fileInputRef.current.value = ''
      setMessage(
        selected.length === 1
          ? 'Image uploaded to Garage.'
          : `${selected.length} images uploaded to Garage.`,
      )
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
        {method: 'DELETE'},
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

  function startItemDrag(
    event: React.DragEvent,
    payload: Readonly<{id: string; kind: 'folder' | 'media'; version: number}>,
  ) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(
      'application/x-bekten-media',
      JSON.stringify(payload),
    )
  }

  async function dropIntoFolder(
    event: React.DragEvent,
    folderId: string | null,
  ) {
    event.preventDefault()
    const raw = event.dataTransfer.getData('application/x-bekten-media')

    if (!raw) return

    try {
      const payload = JSON.parse(raw) as {
        id?: unknown
        kind?: unknown
        version?: unknown
      }

      if (
        typeof payload.id !== 'string' ||
        (payload.kind !== 'folder' && payload.kind !== 'media') ||
        !Number.isInteger(payload.version)
      ) {
        return
      }

      await runCommand({
        action: `${payload.kind}.move`,
        id: payload.id,
        parentId: folderId,
        version: payload.version,
      })
    } catch {
      setMessage('The dragged item is invalid.')
    }
  }

  function openMenu(
    event: React.MouseEvent,
    target: Omit<MenuTarget, 'x' | 'y'>,
  ) {
    event.preventDefault()
    event.stopPropagation()
    menuTriggerRef.current =
      event.currentTarget instanceof HTMLButtonElement
        ? event.currentTarget
        : null
    setMenuTarget({...target, x: event.clientX, y: event.clientY})
  }

  function closeMenu(restoreFocus = false) {
    setMenuTarget(null)

    if (restoreFocus) {
      requestAnimationFrame(() => menuTriggerRef.current?.focus())
    }
  }

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    )
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)
    let nextIndex: number | null = null

    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length
    if (event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + items.length) % items.length
    }
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = items.length - 1

    if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu(true)

      return
    }

    if (nextIndex !== null && items[nextIndex]) {
      event.preventDefault()
      items[nextIndex].focus()
    }
  }

  return (
    <section aria-labelledby="media-library-title">
      <StudioPageHeader
        action={
          <StudioMediaUploadSurface
            accept={ACCEPTED_IMAGE_TYPES}
            inputRef={fileInputRef}
            onFiles={uploadFiles}
            pending={pending}
          />
        }
        description="Organize the visual archive in virtual folders, then attach Garage images to editorial content."
        eyebrow="Garage media"
        title="Media library"
        titleId="media-library-title"
      />

      <p aria-live="polite" className="mt-4 min-h-6 text-sm text-stone-700">
        {message}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-stone-500/25 py-3">
        <nav
          aria-label="Media folder path"
          className="flex min-w-0 items-center gap-1 text-sm"
        >
          <Button
            className="h-9 px-2"
            onClick={() => setCurrentFolderId(null)}
            type="button"
            variant="ghost"
          >
            Media Library
          </Button>
          {currentFolder ? (
            <>
              <ChevronRight
                aria-hidden="true"
                className="size-4 text-stone-500"
              />
              <span className="truncate font-semibold">
                {currentFolder.name}
              </span>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            className="border-stone-500/35 bg-[#f7f1e6]"
            onClick={() => setFolderDialogOpen(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            <FolderPlus aria-hidden="true" className="size-4" />
            New folder
          </Button>
          <div
            aria-label="Media view"
            className="flex rounded-md border border-stone-500/25 p-1"
            role="group"
          >
            <StudioMediaViewButton
              active={view === 'grid'}
              label="Grid view"
              onClick={() => setView('grid')}
            >
              <Grid2X2 aria-hidden="true" className="size-4" />
            </StudioMediaViewButton>
            <StudioMediaViewButton
              active={view === 'list'}
              label="List view"
              onClick={() => setView('list')}
            >
              <List aria-hidden="true" className="size-4" />
            </StudioMediaViewButton>
            <StudioMediaViewButton
              active={view === 'desktop'}
              label="Desktop view"
              onClick={() => setView('desktop')}
            >
              <Monitor aria-hidden="true" className="size-4" />
            </StudioMediaViewButton>
          </div>
        </div>
      </div>

      {visibleFolders.length === 0 && visibleMedia.length === 0 ? (
        <div
          className="mt-8"
          onDragOver={event => event.preventDefault()}
          onDrop={event => void dropIntoFolder(event, currentFolderId)}
        >
          <StudioEmptyState
            action={
              <Button
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                Choose images
              </Button>
            }
            description="Upload an image or create a folder to begin this part of the visual archive."
            title="This folder is empty."
          />
        </div>
      ) : (
        <ul
          className={cn(styles.items, styles[view])}
          data-testid="media-items"
          data-view={view}
          onDragOver={event => event.preventDefault()}
          onDrop={event => void dropIntoFolder(event, currentFolderId)}
        >
          {visibleFolders.map(folder => (
            <li
              className={styles.item}
              draggable
              key={folder.id}
              onContextMenu={event =>
                openMenu(event, {
                  id: folder.id,
                  kind: 'folder',
                  label: folder.name,
                  version: folder.version,
                })
              }
              onDragOver={event => event.preventDefault()}
              onDragStart={event =>
                startItemDrag(event, {
                  id: folder.id,
                  kind: 'folder',
                  version: folder.version,
                })
              }
              onDrop={event => {
                event.stopPropagation()
                void dropIntoFolder(event, folder.id)
              }}
            >
              <button
                className={styles.itemBody}
                onClick={() => setCurrentFolderId(folder.id)}
                type="button"
              >
                <span className={styles.folderPreview}>
                  <Folder aria-hidden="true" />
                </span>
                <span className={styles.itemCopy}>
                  <strong>{folder.name}</strong>
                  <small>Folder</small>
                </span>
              </button>
              <Button
                aria-label={`Actions for ${folder.name}`}
                className={styles.moreButton}
                onClick={event =>
                  openMenu(event, {
                    id: folder.id,
                    kind: 'folder',
                    label: folder.name,
                    version: folder.version,
                  })
                }
                size="icon"
                type="button"
                variant="ghost"
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </li>
          ))}

          {visibleMedia.map((item, index) => (
            <li
              className={styles.item}
              draggable
              key={item.id}
              onContextMenu={event =>
                openMenu(event, {
                  id: item.id,
                  kind: 'media',
                  label: item.displayName,
                  version: item.version,
                })
              }
              onDragStart={event =>
                startItemDrag(event, {
                  id: item.id,
                  kind: 'media',
                  version: item.version,
                })
              }
            >
              <div className={styles.itemBody}>
                {item.status === 'READY' ? (
                  <span className={styles.mediaPreview}>
                    <Image
                      alt={item.filename}
                      fill
                      loading={index < 6 ? 'eager' : 'lazy'}
                      sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 90vw"
                      src={`/api/media/${item.id}`}
                      unoptimized
                    />
                  </span>
                ) : (
                  <span className={styles.failedPreview}>
                    <ImageIcon aria-hidden="true" />
                    {item.status === 'FAILED'
                      ? 'Deletion needs attention'
                      : 'Media quarantined for review'}
                  </span>
                )}
                <span className={styles.itemCopy}>
                  <strong>{item.displayName}</strong>
                  <small>
                    {item.width ?? '—'} × {item.height ?? '—'} ·{' '}
                    {Math.ceil(item.sizeBytes / 1024)} KB
                  </small>
                </span>
              </div>
              <Button
                aria-label={`Actions for ${item.filename}`}
                className={styles.moreButton}
                onClick={event =>
                  openMenu(event, {
                    id: item.id,
                    kind: 'media',
                    label: item.displayName,
                    version: item.version,
                  })
                }
                size="icon"
                type="button"
                variant="ghost"
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
              {canDelete ? (
                <Button
                  className="sr-only"
                  disabled={pending}
                  onClick={() => deleteMedia(item.id)}
                  type="button"
                >
                  {item.status === 'READY' ? 'Delete' : 'Retry deletion'}{' '}
                  {item.filename}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {mediaTotal > 0 ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-500/25 pt-4">
          <p className="text-sm text-stone-600">
            Showing {mediaItems.length} of {mediaTotal} images
          </p>
          {nextCursor ? (
            <Button
              disabled={pending}
              onClick={() => void loadOlderMedia()}
              type="button"
              variant="outline"
            >
              Load older images
            </Button>
          ) : null}
        </div>
      ) : null}

      {menuTarget ? (
        <div
          aria-label={`Actions for ${menuTarget.label}`}
          className={styles.contextMenu}
          onClick={event => event.stopPropagation()}
          onKeyDown={handleMenuKeyDown}
          ref={menuRef}
          role="menu"
          style={{left: menuTarget.x, top: menuTarget.y}}
        >
          <button
            onClick={() => {
              setRenameTarget(menuTarget)
              closeMenu()
              setRenameDialogOpen(true)
            }}
            role="menuitem"
            type="button"
          >
            <Pencil aria-hidden="true" /> Rename
          </button>
          <button
            onClick={() => {
              setMoveTarget(menuTarget)
              closeMenu()
              setMoveDialogOpen(true)
            }}
            role="menuitem"
            type="button"
          >
            <FolderInput aria-hidden="true" /> Move to folder
          </button>
          {canDelete ? (
            <button
              className="text-red-900"
              onClick={() => {
                if (menuTarget.kind === 'media') {
                  void deleteMedia(menuTarget.id)
                } else {
                  void runCommand({
                    action: 'folder.delete',
                    id: menuTarget.id,
                    version: menuTarget.version,
                  })
                }
                closeMenu()
              }}
              role="menuitem"
              type="button"
            >
              <Trash2 aria-hidden="true" /> Delete
            </button>
          ) : null}
        </div>
      ) : null}

      <StudioMediaDialogs
        currentFolderId={currentFolderId}
        folderDialogOpen={folderDialogOpen}
        folders={initialFolders}
        moveDialogOpen={moveDialogOpen}
        moveTarget={moveTarget}
        onFolderDialogOpenChange={setFolderDialogOpen}
        onMoveDialogOpenChange={open => {
          setMoveDialogOpen(open)
          if (!open) setMoveTarget(null)
        }}
        onRenameDialogOpenChange={open => {
          setRenameDialogOpen(open)
          if (!open) setRenameTarget(null)
        }}
        pending={pending}
        renameDialogOpen={renameDialogOpen}
        renameTarget={renameTarget}
        runCommand={runCommand}
      />
    </section>
  )
}
