import {notFound} from 'next/navigation'

import {z} from 'zod'

import {StudioInquiryDetail} from '@/components/studio/studio-inquiry-detail'
import {inquiryStatusSchema} from '@/server/inquiries/inquiry-validation'
import {configuredStudioInquiryService} from '@/server/studio-inquiries/configured-studio-inquiry-service'

import {updateStudioInquiryAction} from '../inquiry-actions'

const inquiryTypeSchema = z.enum([
  'AVAILABILITY',
  'COLLECTOR',
  'COMMISSION',
  'GENERAL',
  'PRIVATE_VIEWING',
])
const noteSchema = z.object({
  authorUser: z
    .object({email: z.email().nullable(), name: z.string().nullable()})
    .nullable(),
  body: z.string(),
  createdAt: z.date(),
  id: z.string().uuid(),
})
const inquirySchema = z
  .object({
    brief: z.string().nullable(),
    createdAt: z.date(),
    email: z.email(),
    id: z.string().uuid(),
    internalNotes: z.array(noteSchema),
    labels: z.array(z.string()),
    locale: z.enum(['en', 'tr', 'ru', 'ky']),
    message: z.string().nullable(),
    name: z.string(),
    phone: z.string().nullable(),
    preferredTimeline: z.string().nullable(),
    relatedArtworkTitle: z.string().nullable(),
    status: inquiryStatusSchema,
    subject: z.string().nullable(),
    type: inquiryTypeSchema,
  })
  .passthrough()

export default async function StudioInquiryDetailPage({
  params,
}: PageProps<'/[locale]/dashboard/inquiries/[id]'>) {
  const {id} = await params
  const found = await configuredStudioInquiryService.findById(
    z.string().uuid().parse(id),
  )

  if (!found) notFound()

  const inquiry = inquirySchema.parse(found)
  const action = updateStudioInquiryAction.bind(null, inquiry.id)

  return (
    <StudioInquiryDetail
      action={action}
      inquiry={{
        brief: inquiry.brief,
        createdAt: inquiry.createdAt.toISOString(),
        email: inquiry.email,
        labels: inquiry.labels,
        locale: inquiry.locale,
        message: inquiry.message,
        name: inquiry.name,
        phone: inquiry.phone,
        preferredTimeline: inquiry.preferredTimeline,
        relatedArtworkTitle: inquiry.relatedArtworkTitle,
        status: inquiry.status,
        subject: inquiry.subject,
        type: inquiry.type,
      }}
      notes={inquiry.internalNotes.map(note => ({
        author:
          note.authorUser?.name ??
          note.authorUser?.email ??
          'Former Studio editor',
        body: note.body,
        createdAt: note.createdAt.toISOString(),
        id: note.id,
      }))}
    />
  )
}
