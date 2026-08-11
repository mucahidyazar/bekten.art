import {notFound} from 'next/navigation'

import {studioEditorialConfigurationForSegment} from '@/server/studio-content/editorial-route-config'

import {StudioEditorialEditorPage} from '../../editorial-pages'

export default async function StudioContentCreateRoute({
  params,
  searchParams,
}: PageProps<'/[locale]/dashboard/[content-type]/new'>) {
  const [routeParameters, searchParameters] = await Promise.all([
    params,
    searchParams,
  ])
  const contentType = routeParameters['content-type']
  const configuration = studioEditorialConfigurationForSegment(contentType)

  if (!configuration) notFound()

  return (
    <StudioEditorialEditorPage
      entityId={null}
      entityType={configuration.entityType}
      initialLocale={
        typeof searchParameters.locale === 'string'
          ? searchParameters.locale
          : undefined
      }
    />
  )
}
