type EditorialRevisionSummary = Readonly<{
  changedFields: readonly string[]
  createdAt: Date
  id: string
  operation: 'PUBLISH' | 'RESTORE'
  version: number
}>

type EditorialRevisionHistoryProps = Readonly<{
  currentVersion: number
  restoreAction: (formData: FormData) => Promise<void>
  revisions: readonly EditorialRevisionSummary[]
}>

export function EditorialRevisionHistory({
  currentVersion,
  restoreAction,
  revisions,
}: EditorialRevisionHistoryProps) {
  return (
    <section
      aria-labelledby="revision-history-title"
      className="mt-12 border-t border-stone-400/70 pt-8"
    >
      <h2 className="font-serif text-3xl" id="revision-history-title">
        Revision history
      </h2>
      <p className="mt-3 max-w-2xl leading-7 text-stone-700">
        Every publication is immutable. Restoring a version creates a new
        revision and keeps the original history intact.
      </p>
      {revisions.length === 0 ? (
        <p className="mt-5 border border-dashed border-stone-500/60 p-5">
          No published revisions yet.
        </p>
      ) : (
        <ol className="mt-6 divide-y divide-stone-400/60 border-y border-stone-400/60">
          {revisions.map(revision => (
            <li
              className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
              key={revision.id}
            >
              <div>
                <h3 className="font-semibold">Version {revision.version}</h3>
                <p className="mt-1 text-sm text-stone-600">
                  {revision.operation === 'RESTORE' ? 'Restored' : 'Published'}{' '}
                  ·{' '}
                  {revision.createdAt
                    .toISOString()
                    .slice(0, 16)
                    .replace('T', ' ')}
                </p>
                <p className="mt-2 text-sm">
                  {revision.changedFields.length > 0
                    ? `Changed: ${revision.changedFields.join(', ')}`
                    : 'Initial published snapshot'}
                </p>
              </div>
              {revision.version !== currentVersion ? (
                <form action={restoreAction}>
                  <input name="revision-id" type="hidden" value={revision.id} />
                  <button
                    className="min-h-11 border border-stone-700 px-4 py-2 font-semibold"
                    type="submit"
                  >
                    Restore version {revision.version}
                  </button>
                </form>
              ) : (
                <span className="text-sm font-semibold">Current version</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export type {EditorialRevisionSummary}
