import Link from 'next/link'
import {notFound} from 'next/navigation'

import {z} from 'zod'

import {EditorialDetail} from '@/components/editorial/editorial-detail'
import {EditorialEntryForm} from '@/components/studio/editorial-entry-form'
import {
  EditorialEntryList,
  type EditorialListEntry,
} from '@/components/studio/editorial-entry-list'
import {EditorialRevisionHistory} from '@/components/studio/editorial-revision-history'
import {prisma} from '@/lib/db'
import {
  editorialLocaleSchema,
  editorialStatusSchema,
} from '@/server/editorial-content'
import {uuidSchema} from '@/server/editorial-content'
import {editorialContentRepository} from '@/server/editorial-persistence/configured-content'
import {studioEditorialConfigurationForType} from '@/server/studio-content/editorial-route-config'

import {
  moveStudioEditorialEntryAction,
  restoreStudioEditorialRevisionAction,
  submitEditorialEntryAction,
} from './editorial-actions'

import type {EditorialEntityType} from '@/server/editorial-publishing'

type SearchParameters = Readonly<
  Record<string, string | readonly string[] | undefined>
>

type StudioEntityRepository = Readonly<{
  findById: (id: string) => Promise<unknown | null>
  list: (query: unknown) => Promise<readonly unknown[]>
}>

const studioRecordSchema = z
  .object({
    id: uuidSchema,
    locale: editorialLocaleSchema,
    slug: z.string(),
    status: editorialStatusSchema,
    title: z.string(),
    updatedAt: z.date(),
    version: z.number().int().positive(),
  })
  .passthrough()
const revisionRowSchema = z.object({
  createdAt: z.date(),
  id: uuidSchema,
  operation: z.enum(['PUBLISH', 'RESTORE']),
  snapshot: z.record(z.string(), z.unknown()),
  version: z.number().int().positive(),
})

function first(value: string | readonly string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

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

function listEntry(
  record: z.output<typeof studioRecordSchema>,
): EditorialListEntry {
  return Object.freeze({
    id: record.id,
    locale: record.locale,
    slug: record.slug,
    status: record.status,
    title: record.title,
    updatedAt: record.updatedAt,
    version: record.version,
  })
}

function changedSnapshotFields(
  current: Readonly<Record<string, unknown>>,
  previous: Readonly<Record<string, unknown>> | undefined,
) {
  if (!previous) return []

  return [...new Set([...Object.keys(current), ...Object.keys(previous)])]
    .filter(
      key => JSON.stringify(current[key]) !== JSON.stringify(previous[key]),
    )
    .sort()
}

export async function StudioEditorialEditorPage({
  entityId,
  entityType,
  notice,
}: Readonly<{
  entityId: string | null
  entityType: EditorialEntityType
  notice?: string
}>) {
  const configuration = studioEditorialConfigurationForType(entityType)
  const [found, availableMedia, revisionRows] = await Promise.all([
    entityId
      ? repositoryFor(entityType).findById(uuidSchema.parse(entityId))
      : null,
    prisma.mediaObject.findMany({
      orderBy: [{createdAt: 'desc'}, {id: 'desc'}],
      select: {filename: true, id: true},
      take: 100,
      where: {provider: 'garage', status: 'READY', visibility: 'PUBLIC'},
    }),
    entityId
      ? prisma.contentRevision.findMany({
          orderBy: [{version: 'desc'}, {id: 'desc'}],
          select: {
            createdAt: true,
            id: true,
            operation: true,
            snapshot: true,
            version: true,
          },
          take: 50,
          where: {entityId: uuidSchema.parse(entityId), entityType},
        })
      : [],
  ])

  if (entityId && !found) notFound()

  const record = found ? studioRecordSchema.parse(found) : null

  const action = submitEditorialEntryAction.bind(
    null,
    entityType,
    entityId,
    record?.version ?? null,
  )
  const revisions = revisionRows.map(row => revisionRowSchema.parse(row))
  const restoreAction = record
    ? restoreStudioEditorialRevisionAction.bind(
        null,
        entityType,
        record.id,
        record.version,
        record.locale,
        record.slug,
      )
    : null

  return (
    <section aria-labelledby="studio-editor-title">
      <Link
        className="text-sm font-semibold underline underline-offset-4"
        href={`/studio/${configuration.routeSegment}`}
      >
        Back to {configuration.label.toLowerCase()}
      </Link>
      <p className="mt-8 text-xs font-semibold tracking-[0.2em] text-red-900 uppercase">
        {record ? `${record.status} · Version ${record.version}` : 'New draft'}
      </p>
      <h1
        className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl"
        id="studio-editor-title"
      >
        {record
          ? `Edit ${record.title}`
          : `Create ${configuration.singularLabel}`}
      </h1>
      {notice === 'publish-failed' ? (
        <p
          className="mt-6 border border-red-900/30 bg-red-50 p-4 text-red-950"
          role="alert"
        >
          The draft was saved, but publication was not completed. Review the
          required media and editorial fields, then publish again.
        </p>
      ) : null}
      <EditorialEntryForm
        action={action}
        availableMedia={availableMedia}
        entityId={record?.id ?? null}
        entityType={entityType}
        initialValue={record ?? {}}
        status={record?.status ?? null}
      />
      {record && restoreAction ? (
        <EditorialRevisionHistory
          currentVersion={record.version}
          restoreAction={restoreAction}
          revisions={revisions.map((revision, index) => ({
            changedFields: changedSnapshotFields(
              revision.snapshot,
              revisions[index + 1]?.snapshot,
            ),
            createdAt: revision.createdAt,
            id: revision.id,
            operation: revision.operation,
            version: revision.version,
          }))}
        />
      ) : null}
    </section>
  )
}

export async function StudioEditorialListPage({
  entityType,
  searchParameters,
}: Readonly<{
  entityType: EditorialEntityType
  searchParameters: SearchParameters
}>) {
  const configuration = studioEditorialConfigurationForType(entityType)
  const locale = editorialLocaleSchema
    .catch('en')
    .parse(first(searchParameters.locale))
  const status = editorialStatusSchema
    .optional()
    .catch(undefined)
    .parse(first(searchParameters.status) || undefined)
  const records = await repositoryFor(entityType).list({
    limit: 100,
    locale,
    ...(status ? {status} : {}),
  })
  const entries = records.map(record =>
    listEntry(studioRecordSchema.parse(record)),
  )
  const reorderAction = moveStudioEditorialEntryAction.bind(
    null,
    entityType,
    locale,
    status,
  )

  return (
    <EditorialEntryList
      currentLocale={locale}
      currentStatus={status}
      entries={entries}
      label={configuration.label}
      reorderAction={reorderAction}
      routeSegment={configuration.routeSegment}
    />
  )
}

export async function StudioEditorialPreviewPage({
  entityId,
  entityType,
}: Readonly<{
  entityId: string
  entityType: EditorialEntityType
}>) {
  const configuration = studioEditorialConfigurationForType(entityType)
  const found = await repositoryFor(entityType).findById(
    uuidSchema.parse(entityId),
  )

  if (!found) notFound()

  const record = studioRecordSchema.parse(found)

  return (
    <section aria-label={`${configuration.singularLabel} draft preview`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          className="text-sm font-semibold underline underline-offset-4"
          href={`/studio/${configuration.routeSegment}/${record.id}`}
        >
          Return to editor
        </Link>
        <span className="border border-red-900 px-3 py-1 text-xs font-semibold tracking-[0.15em] text-red-900 uppercase">
          Draft preview · {record.locale}
        </span>
      </div>
      <div className="mt-16">
        <EditorialDetail
          content={record}
          entityLabel={configuration.singularLabel}
          headingId="studio-preview-title"
        />
      </div>
    </section>
  )
}
