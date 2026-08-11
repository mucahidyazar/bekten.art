'use server'

import {randomUUID} from 'node:crypto'

import {redirect} from 'next/navigation'

import {z} from 'zod'

import {inquiryStatusSchema} from '@/server/inquiries/inquiry-validation'
import {requireStudioEditor} from '@/server/studio-auth/configured-access'
import {configuredStudioInquiryService} from '@/server/studio-inquiries/configured-studio-inquiry-service'

import type {StudioActionState} from '@/components/studio/editorial-action-state'

const formSchema = z.object({
  labels: z.string().max(1_500),
  note: z.string().trim().max(10_000),
  status: inquiryStatusSchema,
})
const inquiryIdSchema = z.string().uuid()

function normalizedLabels(value: string) {
  return Object.freeze(
    [
      ...new Set(
        value
          .split(',')
          .map(label =>
            label
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/gu, '-'),
          )
          .map(label => label.replace(/^-+|-+$/gu, ''))
          .filter(Boolean),
      ),
    ].slice(0, 30),
  )
}

export async function updateStudioInquiryAction(
  inquiryIdInput: string,
  _previousState: StudioActionState,
  formData: FormData,
): Promise<StudioActionState> {
  let redirectTarget: string

  try {
    const user = await requireStudioEditor()
    const inquiryId = inquiryIdSchema.parse(inquiryIdInput)
    const parsed = formSchema.parse({
      labels: formData.get('labels'),
      note: formData.get('note'),
      status: formData.get('status'),
    })

    await configuredStudioInquiryService.update({
      actorUserId: user.id,
      inquiryId,
      labels: normalizedLabels(parsed.labels),
      note: parsed.note,
      requestId: randomUUID(),
      status: parsed.status,
    })
    redirectTarget = `/dashboard/inquiries/${inquiryId}`
  } catch {
    return Object.freeze({
      fieldErrors: Object.freeze({}),
      message: 'The inquiry update could not be saved. Review the fields.',
      status: 'error',
    })
  }

  redirect(redirectTarget)
}
