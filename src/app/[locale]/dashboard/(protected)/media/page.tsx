import {z} from 'zod'

import {StudioMediaLibrary} from '@/components/studio/studio-media-library'
import {prisma} from '@/lib/db'
import {requireStudioEditor} from '@/server/studio-auth/configured-access'
import {isStudioOwnerRole} from '@/server/studio-auth/roles'

import type {Prisma} from '@prisma/client'

const visibleStudioMediaStatusSchema = z.enum([
  'READY',
  'FAILED',
  'QUARANTINED',
])

export default async function StudioMediaPage() {
  const user = await requireStudioEditor()
  const canDelete = isStudioOwnerRole(user.role)
  const mediaWhere: Prisma.MediaObjectWhereInput = canDelete
    ? {
        provider: 'garage',
        status: {in: ['READY', 'FAILED', 'QUARANTINED']},
      }
    : {
        provider: 'garage',
        status: 'READY',
        visibility: 'PUBLIC',
      }
  const [folders, mediaRows, mediaTotal] = await Promise.all([
    prisma.mediaFolder.findMany({
      orderBy: [{name: 'asc'}, {id: 'asc'}],
      select: {id: true, name: true, parentId: true, version: true},
    }),
    prisma.mediaObject.findMany({
      orderBy: [{createdAt: 'desc'}, {id: 'desc'}],
      select: {
        createdAt: true,
        displayName: true,
        filename: true,
        folderId: true,
        height: true,
        id: true,
        sizeBytes: true,
        status: true,
        version: true,
        width: true,
      },
      take: 101,
      where: mediaWhere,
    }),
    prisma.mediaObject.count({where: mediaWhere}),
  ])
  const media = mediaRows.slice(0, 100)
  const nextCursor = mediaRows.length > 100 ? media.at(-1)?.id ?? null : null
  const libraryVersion = [...folders, ...media]
    .map(item => `${item.id}:${item.version}`)
    .join('|')

  return (
    <StudioMediaLibrary
      canDelete={canDelete}
      initialFolders={folders}
      initialMediaTotal={mediaTotal}
      initialNextCursor={nextCursor}
      key={libraryVersion}
      initialMedia={media.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        status: visibleStudioMediaStatusSchema.parse(item.status),
      }))}
    />
  )
}
