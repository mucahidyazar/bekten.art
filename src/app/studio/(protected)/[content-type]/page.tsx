import {notFound} from 'next/navigation'

import {studioEditorialConfigurationForSegment} from '@/server/studio-content/editorial-route-config'

import {StudioEditorialListPage} from '../editorial-pages'

export default async function StudioContentListRoute({
  params,
  searchParams,
}: PageProps<'/studio/[content-type]'>) {
  const [routeParameters, searchParameters] = await Promise.all([
    params,
    searchParams,
  ])
  const contentType = routeParameters['content-type']
  const configuration = studioEditorialConfigurationForSegment(contentType)

  if (!configuration) notFound()

  return (
    <StudioEditorialListPage
      entityType={configuration.entityType}
      searchParameters={searchParameters}
    />
  )
}
