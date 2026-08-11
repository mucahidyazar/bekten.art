import type {EditorialEntityType} from '@/server/editorial-publishing'

export const STUDIO_EDITORIAL_CONFIGURATIONS = Object.freeze([
  {
    entityType: 'ARTWORK',
    label: 'Artworks',
    routeSegment: 'artworks',
    singularLabel: 'artwork',
  },
  {
    entityType: 'COLLECTION',
    label: 'Collections',
    routeSegment: 'collections',
    singularLabel: 'collection',
  },
  {
    entityType: 'EXHIBITION',
    label: 'Exhibitions',
    routeSegment: 'exhibitions',
    singularLabel: 'exhibition',
  },
  {
    entityType: 'JOURNAL_ENTRY',
    label: 'Journal',
    routeSegment: 'journal',
    singularLabel: 'journal entry',
  },
  {
    entityType: 'PAGE',
    label: 'Pages',
    routeSegment: 'pages',
    singularLabel: 'page',
  },
  {
    entityType: 'PRESS_ENTRY',
    label: 'Press',
    routeSegment: 'press',
    singularLabel: 'press entry',
  },
] as const satisfies readonly StudioEditorialConfiguration[])

export type StudioEditorialConfiguration = Readonly<{
  entityType: EditorialEntityType
  label: string
  routeSegment:
    'artworks' | 'collections' | 'exhibitions' | 'journal' | 'pages' | 'press'
  singularLabel: string
}>

export function studioEditorialConfigurationForSegment(segment: string) {
  return (
    STUDIO_EDITORIAL_CONFIGURATIONS.find(
      configuration => configuration.routeSegment === segment,
    ) ?? null
  )
}

export function studioEditorialConfigurationForType(
  entityType: EditorialEntityType,
) {
  const configuration = STUDIO_EDITORIAL_CONFIGURATIONS.find(
    candidate => candidate.entityType === entityType,
  )

  if (!configuration) throw new Error('STUDIO_EDITORIAL_CONFIG_INVALID')

  return configuration
}
