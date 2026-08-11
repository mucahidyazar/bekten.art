'use client'

import Image from 'next/image'

import {useState} from 'react'

import type {ContentMediaPlacementEdit} from '@/server/editorial-content'
import type {EditorialEntityType} from '@/server/editorial-publishing'

export function EditorialMediaPlacements({
  availableMedia,
  entityType,
  initialPlacements,
}: EditorialMediaPlacementsProps) {
  const [placements, setPlacements] = useState(() =>
    normalized(initialPlacements),
  )
  const mediaById = new Map(availableMedia.map(media => [media.id, media]))

  function toggle(media: StudioAvailableMedia) {
    setPlacements(current => {
      const exists = current.some(
        placement => placement.mediaObjectId === media.id,
      )

      if (exists) {
        return normalized(
          current.filter(placement => placement.mediaObjectId !== media.id),
        )
      }

      return normalized([
        ...current,
        Object.freeze({
          altText: '',
          caption: null,
          credit: null,
          crop: 'ORIGINAL' as const,
          displayOrder: current.length,
          focalPoint: null,
          mediaObjectId: media.id,
          role: current.some(placement => placement.role === 'HERO')
            ? ('GALLERY' as const)
            : ('HERO' as const),
        }),
      ])
    })
  }

  function update(
    mediaObjectId: string,
    changes: Partial<ContentMediaPlacementEdit>,
  ) {
    setPlacements(current =>
      normalized(
        current.map(placement => {
          if (
            changes.role === 'HERO' &&
            placement.mediaObjectId !== mediaObjectId
          ) {
            return placement.role === 'HERO'
              ? Object.freeze({...placement, role: 'GALLERY' as const})
              : placement
          }

          return placement.mediaObjectId === mediaObjectId
            ? Object.freeze({...placement, ...changes})
            : placement
        }),
      ),
    )
  }

  function move(mediaObjectId: string, offset: -1 | 1) {
    setPlacements(current => {
      const sourceIndex = current.findIndex(
        placement => placement.mediaObjectId === mediaObjectId,
      )
      const targetIndex = sourceIndex + offset

      if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= current.length) {
        return current
      }

      return normalized(
        current.map((placement, index) => {
          if (index === sourceIndex) return current[targetIndex] ?? placement
          if (index === targetIndex) return current[sourceIndex] ?? placement

          return placement
        }),
      )
    })
  }

  return (
    <fieldset className="border-t border-stone-400/70 pt-7">
      <legend className="px-2 font-serif text-2xl">
        Media and alternative text
      </legend>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-700">
        Choose Garage images, assign their editorial purpose, and describe the
        visual meaning for visitors who cannot see them.
      </p>

      {availableMedia.length === 0 ? (
        <p className="mt-5 border border-dashed border-stone-500/60 p-5">
          Upload media in the Studio media library before attaching images.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableMedia.map(media => (
            <label
              className="flex min-h-16 items-center gap-3 border border-stone-400/60 bg-white/30 p-3"
              key={media.id}
            >
              <Image
                alt=""
                className="h-12 w-12 object-cover"
                height={48}
                src={`/api/media/${media.id}`}
                unoptimized
                width={48}
              />
              <input
                checked={placements.some(
                  placement => placement.mediaObjectId === media.id,
                )}
                onChange={() => toggle(media)}
                type="checkbox"
              />
              <span className="min-w-0 truncate text-sm font-semibold">
                Use {media.filename}
              </span>
            </label>
          ))}
        </div>
      )}

      {placements.length > 0 ? (
        <ol className="mt-7 space-y-4">
          {placements.map((placement, index) => {
            const media = mediaById.get(placement.mediaObjectId)
            const filename = media?.filename ?? placement.mediaObjectId

            return (
              <li
                className="grid gap-4 border border-stone-400/60 bg-[#f8f2e6] p-5 md:grid-cols-2"
                key={placement.mediaObjectId}
              >
                <div className="flex items-center justify-between gap-3 md:col-span-2">
                  <strong data-testid="selected-media-name">{filename}</strong>
                  <div className="flex gap-2">
                    <button
                      aria-label={`Move ${filename} earlier`}
                      className="min-h-11 px-3 underline disabled:opacity-30"
                      disabled={index === 0}
                      onClick={() => move(placement.mediaObjectId, -1)}
                      type="button"
                    >
                      Earlier
                    </button>
                    <button
                      aria-label={`Move ${filename} later`}
                      className="min-h-11 px-3 underline disabled:opacity-30"
                      disabled={index === placements.length - 1}
                      onClick={() => move(placement.mediaObjectId, 1)}
                      type="button"
                    >
                      Later
                    </button>
                  </div>
                </div>
                <label>
                  <span className="text-sm font-semibold">
                    Role for {filename}
                  </span>
                  <select
                    className={inputClassName}
                    onChange={event =>
                      update(placement.mediaObjectId, {
                        role: event.target
                          .value as ContentMediaPlacementEdit['role'],
                      })
                    }
                    value={placement.role}
                  >
                    <option value="HERO">Hero</option>
                    <option value="THUMBNAIL">Thumbnail</option>
                    <option value="GALLERY">Gallery</option>
                    <option value="INLINE">Inline</option>
                    <option value="SEO">SEO</option>
                  </select>
                </label>
                <label>
                  <span className="text-sm font-semibold">
                    Crop for {filename}
                  </span>
                  <select
                    className={inputClassName}
                    onChange={event =>
                      update(placement.mediaObjectId, {
                        crop: event.target
                          .value as ContentMediaPlacementEdit['crop'],
                      })
                    }
                    value={placement.crop}
                  >
                    <option value="ORIGINAL">Original</option>
                    <option value="LANDSCAPE">Landscape</option>
                    <option value="PORTRAIT">Portrait</option>
                    <option value="SQUARE">Square</option>
                  </select>
                </label>
                <label className="md:col-span-2">
                  <span className="text-sm font-semibold">
                    Alternative text for {filename}
                  </span>
                  <input
                    className={inputClassName}
                    maxLength={300}
                    minLength={5}
                    onChange={event =>
                      update(placement.mediaObjectId, {
                        altText: event.target.value,
                      })
                    }
                    required
                    value={placement.altText}
                  />
                </label>
              </li>
            )
          })}
        </ol>
      ) : null}

      <input
        name="media-placements"
        type="hidden"
        value={JSON.stringify(placements)}
      />
      <input name="media-entity-type" type="hidden" value={entityType} />
    </fieldset>
  )
}

type EditorialMediaPlacementsProps = Readonly<{
  availableMedia: readonly StudioAvailableMedia[]
  entityType: EditorialEntityType
  initialPlacements: readonly ContentMediaPlacementEdit[]
}>

const inputClassName =
  'mt-2 min-h-11 w-full border border-stone-500/70 bg-[#fffaf0] px-3 py-2 outline-none focus-visible:border-red-900 focus-visible:ring-2 focus-visible:ring-red-900/20'

function normalized(
  placements: readonly ContentMediaPlacementEdit[],
): readonly ContentMediaPlacementEdit[] {
  return Object.freeze(
    placements.map((placement, displayOrder) =>
      Object.freeze({...placement, displayOrder}),
    ),
  )
}

export type StudioAvailableMedia = Readonly<{
  filename: string
  id: string
}>
