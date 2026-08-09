import {z} from 'zod'

import {artworkCreateSchema, uuidSchema} from './domain'

import type {ContentRepository} from './content-repository'

const publishInputSchema = z.object({
  id: uuidSchema,
  publishedAt: z.date().default(() => new Date()),
})

export function createContentService(repository: ContentRepository) {
  return Object.freeze({
    createArtworkDraft(input: z.input<typeof artworkCreateSchema>) {
      const parsed = artworkCreateSchema.parse({...input, status: 'DRAFT'})

      return repository.artworks.create(parsed)
    },
    publishArtwork(input: z.input<typeof publishInputSchema>) {
      const parsed = publishInputSchema.parse(input)

      return repository.artworks.update(parsed.id, {
        publishedAt: parsed.publishedAt,
        status: 'PUBLISHED',
      })
    },
  })
}
