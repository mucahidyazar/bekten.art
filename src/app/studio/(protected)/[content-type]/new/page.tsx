import {notFound} from 'next/navigation'

import {studioEditorialConfigurationForSegment} from '@/server/studio-content/editorial-route-config'

import {StudioEditorialEditorPage} from '../../editorial-pages'

export default async function StudioContentCreateRoute({
  params,
}: PageProps<'/studio/[content-type]/new'>) {
  const routeParameters = await params
  const contentType = routeParameters['content-type']
  const configuration = studioEditorialConfigurationForSegment(contentType)

  if (!configuration) notFound()

  return (
    <StudioEditorialEditorPage
      entityId={null}
      entityType={configuration.entityType}
    />
  )
}
