import {notFound} from 'next/navigation'

import {studioEditorialConfigurationForSegment} from '@/server/studio-content/editorial-route-config'

import {StudioEditorialEditorPage} from '../../editorial-pages'

export default async function StudioContentEditRoute({
  params,
  searchParams,
}: PageProps<'/studio/[content-type]/[id]'>) {
  const [routeParameters, searchParameters] = await Promise.all([
    params,
    searchParams,
  ])
  const contentType = routeParameters['content-type']
  const {id} = routeParameters
  const configuration = studioEditorialConfigurationForSegment(contentType)

  if (!configuration) notFound()

  return (
    <StudioEditorialEditorPage
      entityId={id}
      entityType={configuration.entityType}
      notice={
        typeof searchParameters.notice === 'string'
          ? searchParameters.notice
          : undefined
      }
    />
  )
}
