type PrismaClientCandidate = Readonly<{
  $disconnect: () => Promise<unknown>
}>

const REQUIRED_DELEGATES = Object.freeze([
  'mediaFolder',
  'siteLocale',
  'uiTranslationOverride',
])

function hasRequiredDelegates(client: PrismaClientCandidate) {
  const delegates = client as unknown as Readonly<Record<string, unknown>>

  return REQUIRED_DELEGATES.every(delegate => delegates[delegate] !== undefined)
}

function disconnectStaleClient(client: PrismaClientCandidate) {
  try {
    void client.$disconnect().catch(() => undefined)
  } catch {
    // Replacing a stale development client must not block the next request.
  }
}

function selectPrismaClient<TClient extends PrismaClientCandidate>({
  cached,
  cachedSchemaVersion,
  create,
  expectedSchemaVersion,
}: Readonly<{
  cached?: TClient
  cachedSchemaVersion?: string
  create: () => TClient
  expectedSchemaVersion: string
}>) {
  if (
    cached &&
    cachedSchemaVersion === expectedSchemaVersion &&
    hasRequiredDelegates(cached)
  ) {
    return cached
  }

  if (cached) disconnectStaleClient(cached)

  return create()
}

export {selectPrismaClient}
