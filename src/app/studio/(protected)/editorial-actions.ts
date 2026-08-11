'use server'

import {randomUUID} from 'node:crypto'

import {redirect} from 'next/navigation'

import {z} from 'zod'

import {localizedPath} from '@/lib/localized-path'
import {editorialContentRepository} from '@/server/editorial-persistence/configured-content'
import {editorialPublishingService} from '@/server/editorial-persistence/configured-publishing'
import {EditorialVersionConflictError} from '@/server/editorial-publishing'
import {requireStudioEditor} from '@/server/studio-auth/configured-access'
import {parseEditorialFormData} from '@/server/studio-content/editorial-form-data'

import type {StudioActionState} from '@/components/studio/editorial-action-state'
import type {EditorialMutationContext} from '@/server/editorial-content'
import type {EditorialEntityType} from '@/server/editorial-publishing'

type StudioEntityRepository = Readonly<{
  archive: (
    id: string,
    expectedVersion: number,
    context: EditorialMutationContext,
  ) => Promise<unknown>
  create: (
    value: unknown,
    context: EditorialMutationContext,
  ) => Promise<unknown>
  list: (query: unknown) => Promise<readonly unknown[]>
  reorder: (
    input: readonly Readonly<{
      displayOrder: number
      expectedVersion: number
      id: string
    }>[],
    context: EditorialMutationContext,
  ) => Promise<readonly unknown[]>
  update: (
    id: string,
    input: Readonly<{expectedVersion: number; value: unknown}>,
    context: EditorialMutationContext,
  ) => Promise<unknown>
}>

const entityTypeSchema = z.enum([
  'ARTWORK',
  'COLLECTION',
  'EXHIBITION',
  'JOURNAL_ENTRY',
  'PAGE',
  'PRESS_ENTRY',
])
const entityIdSchema = z.string().uuid()
const expectedVersionSchema = z.number().int().positive()
const intentSchema = z.enum(['archive', 'publish', 'save'])
const savedRecordSchema = z.object({
  id: entityIdSchema,
  locale: z.enum(['en', 'tr', 'ru', 'ky']),
  slug: z.string(),
  version: expectedVersionSchema,
})
const reorderRecordSchema = z.object({
  displayOrder: z.number().int().nonnegative(),
  id: entityIdSchema,
  version: expectedVersionSchema,
})
const reorderFormSchema = z.object({
  direction: z.enum(['earlier', 'later']),
  entryId: entityIdSchema,
})
const editorialLocaleSchema = z.enum(['en', 'tr', 'ru', 'ky'])
const editorialStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])

const routeSegments = Object.freeze({
  ARTWORK: 'artworks',
  COLLECTION: 'collections',
  EXHIBITION: 'exhibitions',
  JOURNAL_ENTRY: 'journal',
  PAGE: 'pages',
  PRESS_ENTRY: 'press',
}) satisfies Readonly<Record<EditorialEntityType, string>>

function repositoryFor(entityType: EditorialEntityType) {
  const repositories = {
    ARTWORK: editorialContentRepository.artworks,
    COLLECTION: editorialContentRepository.collections,
    EXHIBITION: editorialContentRepository.exhibitions,
    JOURNAL_ENTRY: editorialContentRepository.journalEntries,
    PAGE: editorialContentRepository.pages,
    PRESS_ENTRY: editorialContentRepository.pressEntries,
  }

  return repositories[entityType] as unknown as StudioEntityRepository
}

function revalidationPaths(
  entityType: EditorialEntityType,
  locale: 'en' | 'ky' | 'ru' | 'tr',
  slug: string,
) {
  const publicSegments = {
    ARTWORK: 'works',
    COLLECTION: 'collections',
    EXHIBITION: 'exhibitions',
    JOURNAL_ENTRY: 'journal',
    PAGE: 'pages',
    PRESS_ENTRY: 'press',
  } satisfies Readonly<Record<EditorialEntityType, string>>
  const segment = publicSegments[entityType]
  const indexPath = entityType === 'PAGE' ? '/' : `/${segment}`
  const detailPath = entityType === 'PAGE' ? `/${slug}` : `/${segment}/${slug}`

  return Array.from(
    new Set([
      localizedPath(locale, '/'),
      localizedPath(locale, indexPath),
      localizedPath(locale, detailPath),
    ]),
  )
}

function validationState(error: z.ZodError): StudioActionState {
  const flattened = z.flattenError(error)

  return Object.freeze({
    fieldErrors: Object.freeze(flattened.fieldErrors),
    message: 'Review the highlighted editorial fields.',
    status: 'error',
  })
}

function failureState(error: unknown): StudioActionState {
  if (error instanceof z.ZodError) return validationState(error)

  if (error instanceof EditorialVersionConflictError) {
    return Object.freeze({
      fieldErrors: Object.freeze({}),
      message: 'This record changed in another session. Reload before saving.',
      status: 'error',
    })
  }

  return Object.freeze({
    fieldErrors: Object.freeze({}),
    message: 'The editorial change could not be saved. Try again.',
    status: 'error',
  })
}

export async function moveStudioEditorialEntryAction(
  entityTypeInput: EditorialEntityType,
  localeInput: 'en' | 'ky' | 'ru' | 'tr',
  statusInput: 'ARCHIVED' | 'DRAFT' | 'PUBLISHED' | undefined,
  formData: FormData,
) {
  const user = await requireStudioEditor()
  const entityType = entityTypeSchema.parse(entityTypeInput)
  const locale = editorialLocaleSchema.parse(localeInput)
  const status = editorialStatusSchema.optional().parse(statusInput)
  const input = reorderFormSchema.parse({
    direction: formData.get('direction'),
    entryId: formData.get('entry-id'),
  })
  const repository = repositoryFor(entityType)
  const records = (
    await repository.list({limit: 100, locale, ...(status ? {status} : {})})
  ).map(record => reorderRecordSchema.parse(record))
  const sourceIndex = records.findIndex(record => record.id === input.entryId)
  const targetIndex = sourceIndex + (input.direction === 'earlier' ? -1 : 1)

  if (sourceIndex >= 0 && targetIndex >= 0 && targetIndex < records.length) {
    const ordered = records.map((record, index) => {
      if (index === sourceIndex) return records[targetIndex] ?? record
      if (index === targetIndex) return records[sourceIndex] ?? record

      return record
    })

    await repository.reorder(
      ordered.map((record, displayOrder) => ({
        displayOrder,
        expectedVersion: record.version,
        id: record.id,
      })),
      {actorUserId: user.id, requestId: randomUUID()},
    )
  }

  const query = new URLSearchParams({locale})

  if (status) query.set('status', status)

  redirect(`/studio/${routeSegments[entityType]}?${query.toString()}`)
}

export async function restoreStudioEditorialRevisionAction(
  entityTypeInput: EditorialEntityType,
  entityIdInput: string,
  expectedVersionInput: number,
  localeInput: 'en' | 'ky' | 'ru' | 'tr',
  slugInput: string,
  formData: FormData,
) {
  const user = await requireStudioEditor()
  const entityType = entityTypeSchema.parse(entityTypeInput)
  const entityId = entityIdSchema.parse(entityIdInput)
  const expectedVersion = expectedVersionSchema.parse(expectedVersionInput)
  const locale = editorialLocaleSchema.parse(localeInput)
  const slug = z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
    .parse(slugInput)
  const revisionId = entityIdSchema.parse(formData.get('revision-id'))

  await editorialPublishingService.restore({
    actorUserId: user.id,
    entityId,
    entityType,
    expectedVersion,
    revisionId,
    revalidationPaths: revalidationPaths(entityType, locale, slug),
  })
  redirect(`/studio/${routeSegments[entityType]}/${entityId}`)
}

export async function submitEditorialEntryAction(
  entityTypeInput: EditorialEntityType,
  entityIdInput: string | null,
  expectedVersionInput: number | null,
  _previousState: StudioActionState,
  formData: FormData,
): Promise<StudioActionState> {
  let redirectTarget: string

  try {
    const user = await requireStudioEditor()
    const entityType = entityTypeSchema.parse(entityTypeInput)
    const intent = intentSchema.parse(formData.get('intent'))
    const repository = repositoryFor(entityType)
    const context = Object.freeze({
      actorUserId: user.id,
      requestId: randomUUID(),
    })

    if (intent === 'publish' && !entityIdInput) {
      return Object.freeze({
        fieldErrors: Object.freeze({}),
        message: 'Save the draft before publishing it.',
        status: 'error',
      })
    }

    if (intent === 'archive') {
      const entityId = entityIdSchema.parse(entityIdInput)
      const expectedVersion = expectedVersionSchema.parse(expectedVersionInput)

      await repository.archive(entityId, expectedVersion, context)
      redirectTarget = `/studio/${routeSegments[entityType]}`
    } else {
      const edit = parseEditorialFormData(entityType, formData)
      const saved = savedRecordSchema.parse(
        entityIdInput
          ? await repository.update(
              entityIdSchema.parse(entityIdInput),
              {
                expectedVersion:
                  expectedVersionSchema.parse(expectedVersionInput),
                value: edit,
              },
              context,
            )
          : await repository.create(edit, context),
      )

      let publicationFailed = false

      if (intent === 'publish') {
        try {
          await editorialPublishingService.publish({
            actorUserId: user.id,
            entityId: saved.id,
            entityType,
            expectedVersion: saved.version,
            revalidationPaths: revalidationPaths(
              entityType,
              saved.locale,
              saved.slug,
            ),
          })
        } catch {
          publicationFailed = true
        }
      }

      redirectTarget = `/studio/${routeSegments[entityType]}/${saved.id}${publicationFailed ? '?notice=publish-failed' : ''}`
    }
  } catch (error) {
    return failureState(error)
  }

  redirect(redirectTarget)
}
