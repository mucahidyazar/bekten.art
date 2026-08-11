import {z} from 'zod'

import {StudioMediaLibrary} from '@/components/studio/studio-media-library'
import {prisma} from '@/lib/db'
import {requireStudioEditor} from '@/server/studio-auth/configured-access'
import {isStudioOwnerRole} from '@/server/studio-auth/roles'

const visibleStudioMediaStatusSchema = z.enum([
  'READY',
  'FAILED',
  'QUARANTINED',
])

export default async function StudioMediaPage() {
  const user = await requireStudioEditor()
  const canDelete = isStudioOwnerRole(user.role)
  const media = await prisma.mediaObject.findMany({
    orderBy: [{createdAt: 'desc'}, {id: 'desc'}],
    select: {
      createdAt: true,
      filename: true,
      height: true,
      id: true,
      sizeBytes: true,
      status: true,
      width: true,
    },
    take: 100,
    where: canDelete
      ? {
          provider: 'garage',
          status: {in: ['READY', 'FAILED', 'QUARANTINED']},
        }
      : {provider: 'garage', status: 'READY', visibility: 'PUBLIC'},
  })

  return (
    <StudioMediaLibrary
      canDelete={canDelete}
      initialMedia={media.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        status: visibleStudioMediaStatusSchema.parse(item.status),
      }))}
    />
  )
}
