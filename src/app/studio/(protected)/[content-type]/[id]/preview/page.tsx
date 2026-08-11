import {notFound} from 'next/navigation'

import {studioEditorialConfigurationForSegment} from '@/server/studio-content/editorial-route-config'

import {StudioEditorialPreviewPage} from '../../../editorial-pages'

export default async function StudioContentPreviewRoute({
  params,
}: PageProps<'/studio/[content-type]/[id]/preview'>) {
  const routeParameters = await params
  const contentType = routeParameters['content-type']
  const {id} = routeParameters
  const configuration = studioEditorialConfigurationForSegment(contentType)

  if (!configuration) notFound()

  return (
    <StudioEditorialPreviewPage
      entityId={id}
      entityType={configuration.entityType}
    />
  )
}
