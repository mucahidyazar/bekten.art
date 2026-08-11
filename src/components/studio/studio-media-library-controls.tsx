'use client'

import {UploadCloud} from 'lucide-react'
import {useState} from 'react'

import {Button} from '@/components/ui/button'
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
import {cn} from '@/utils'

import styles from './studio-media-library.module.css'

type StudioMediaActionTarget = Readonly<{
  id: string
  kind: 'folder' | 'media'
  label: string
  version: number
}>

type StudioMediaFolderOption = Readonly<{
  id: string
  name: string
  parentId: string | null
}>

type RunMediaCommand = (
  body: Readonly<Record<string, unknown>>,
) => Promise<boolean>

type StudioMediaUploadSurfaceProps = Readonly<{
  accept: string
  inputRef: React.RefObject<HTMLInputElement | null>
  onFiles: (files: readonly File[]) => Promise<void>
  pending: boolean
}>

type StudioMediaViewButtonProps = Readonly<{
  active: boolean
  children: React.ReactNode
  label: string
  onClick: () => void
}>

type StudioMediaDialogsProps = Readonly<{
  currentFolderId: string | null
  folderDialogOpen: boolean
  folders: readonly StudioMediaFolderOption[]
  moveDialogOpen: boolean
  moveTarget: StudioMediaActionTarget | null
  onFolderDialogOpenChange: (open: boolean) => void
  onMoveDialogOpenChange: (open: boolean) => void
  onRenameDialogOpenChange: (open: boolean) => void
  renameDialogOpen: boolean
  renameTarget: StudioMediaActionTarget | null
  runCommand: RunMediaCommand
  pending: boolean
}>

function moveDestinations(
  folders: readonly StudioMediaFolderOption[],
  target: StudioMediaActionTarget | null,
) {
  if (!target || target.kind === 'media') return folders

  const excludedIds = new Set([target.id])
  let discovered = true

  while (discovered) {
    discovered = false

    for (const folder of folders) {
      if (
        folder.parentId &&
        excludedIds.has(folder.parentId) &&
        !excludedIds.has(folder.id)
      ) {
        excludedIds.add(folder.id)
        discovered = true
      }
    }
  }

  return folders.filter(folder => !excludedIds.has(folder.id))
}

function StudioMediaDialogs({
  currentFolderId,
  folderDialogOpen,
  folders,
  moveDialogOpen,
  moveTarget,
  onFolderDialogOpenChange,
  onMoveDialogOpenChange,
  onRenameDialogOpenChange,
  pending,
  renameDialogOpen,
  renameTarget,
  runCommand,
}: StudioMediaDialogsProps) {
  return (
    <>
      <Dialog onOpenChange={onFolderDialogOpenChange} open={folderDialogOpen}>
        <DialogContent className="border-stone-500/35 bg-[#f7f1e6]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              New folder
            </DialogTitle>
            <DialogDescription>
              Folders organize the Studio without changing Garage object keys.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault()
              const form = new FormData(event.currentTarget)
              const name = String(form.get('name') ?? '').trim()

              if (!name) return
              void runCommand({
                action: 'folder.create',
                name,
                parentId: currentFolderId,
              }).then(success => success && onFolderDialogOpenChange(false))
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="new-media-folder-name">Folder name</Label>
              <Input
                id="new-media-folder-name"
                maxLength={120}
                name="name"
                required
              />
            </div>
            <DialogFooter>
              <Button disabled={pending} type="submit">
                Create folder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={onMoveDialogOpenChange} open={moveDialogOpen}>
        <DialogContent className="border-stone-500/35 bg-[#f7f1e6]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Move item</DialogTitle>
            <DialogDescription>
              Choose a virtual folder. Garage object keys stay unchanged.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault()
              if (!moveTarget) return

              const form = new FormData(event.currentTarget)
              const parentId = String(form.get('parentId') ?? '') || null

              void runCommand({
                action: `${moveTarget.kind}.move`,
                id: moveTarget.id,
                parentId,
                version: moveTarget.version,
              }).then(success => {
                if (success) onMoveDialogOpenChange(false)
              })
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="move-media-destination">Destination folder</Label>
              <select
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                defaultValue={currentFolderId ?? ''}
                id="move-media-destination"
                name="parentId"
              >
                <option value="">Media Library (root)</option>
                {moveDestinations(folders, moveTarget).map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button disabled={pending} type="submit">
                Move item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={onRenameDialogOpenChange} open={renameDialogOpen}>
        <DialogContent className="border-stone-500/35 bg-[#f7f1e6]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              Rename item
            </DialogTitle>
            <DialogDescription>
              The original Garage filename remains unchanged.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault()
              if (!renameTarget) return
              const form = new FormData(event.currentTarget)
              const name = String(form.get('name') ?? '').trim()

              if (!name) return
              void runCommand({
                action: `${renameTarget.kind}.rename`,
                id: renameTarget.id,
                name,
                version: renameTarget.version,
              }).then(success => {
                if (success) onRenameDialogOpenChange(false)
              })
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="rename-media-item">Display name</Label>
              <Input
                defaultValue={renameTarget?.label ?? ''}
                id="rename-media-item"
                maxLength={255}
                name="name"
                required
              />
            </div>
            <DialogFooter>
              <Button disabled={pending} type="submit">
                Save name
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function StudioMediaUploadSurface({
  accept,
  inputRef,
  onFiles,
  pending,
}: StudioMediaUploadSurfaceProps) {
  const [dragging, setDragging] = useState(false)

  return (
    <form
      className={styles.uploadSurface}
      data-upload-state={dragging ? 'dragging' : 'idle'}
      data-testid="media-upload-surface"
      onDragEnter={event => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDragging(false)
        }
      }}
      onDragOver={event => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      }}
      onDrop={event => {
        event.preventDefault()
        setDragging(false)
        void onFiles([...event.dataTransfer.files])
      }}
      onSubmit={event => {
        event.preventDefault()
        void onFiles(Array.from(inputRef.current?.files ?? []))
      }}
    >
      <label className={styles.uploadLabel} htmlFor="studio-media-upload">
        <UploadCloud aria-hidden="true" className="size-6" />
        <span>
          <strong>{pending ? 'Working…' : 'Drop artwork here'}</strong>
          <small>or click to browse · JPEG, PNG, WebP, AVIF</small>
        </span>
      </label>
      <Input
        accept={accept}
        aria-label="Choose artwork image"
        className="sr-only"
        id="studio-media-upload"
        multiple
        name="file"
        onChange={event =>
          void onFiles(Array.from(event.currentTarget.files ?? []))
        }
        ref={inputRef}
        type="file"
      />
      <Button className="sr-only" disabled={pending} type="submit">
        Upload image
      </Button>
    </form>
  )
}

export type {StudioMediaActionTarget}
export {StudioMediaDialogs, StudioMediaUploadSurface, StudioMediaViewButton}

function StudioMediaViewButton({
  active,
  children,
  label,
  onClick,
}: StudioMediaViewButtonProps) {
  return (
    <Button
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'size-9 border-stone-500/35 p-0',
        active && 'bg-[#6f2a1a] text-[#fffaf0] hover:bg-[#542014]',
      )}
      onClick={onClick}
      size="icon"
      type="button"
      variant="outline"
    >
      {children}
    </Button>
  )
}
