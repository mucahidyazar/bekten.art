import type {
  PublicInquiryFormProps,
  PublicInquiryLocale,
  PublicInquiryType,
} from './public-inquiry-types'

type InquiryPayload = Readonly<
  Record<string, boolean | number | string | string[]>
>

function optionalText(form: FormData, field: string) {
  const value = String(form.get(field) ?? '').trim()

  return value || undefined
}

function commonPayload(
  form: FormData,
  locale: PublicInquiryLocale,
  submissionId: string,
  type: PublicInquiryType,
) {
  const phone = optionalText(form, 'phone')

  return {
    consent: form.get('consent') === 'on',
    email: String(form.get('email') ?? '').trim(),
    locale,
    name: String(form.get('name') ?? '').trim(),
    ...(phone ? {phone} : {}),
    submissionId,
    type,
    website: String(form.get('website') ?? ''),
  }
}

export function buildPublicInquiryPayload(
  form: FormData,
  props: PublicInquiryFormProps,
  submissionId: string,
): InquiryPayload {
  const common = commonPayload(form, props.locale, submissionId, props.type)
  const message = optionalText(form, 'message')

  if (props.type === 'AVAILABILITY') {
    return {
      ...common,
      ...(message ? {message} : {}),
      relatedArtworkId: props.artwork.id,
    }
  }

  if (props.type === 'COMMISSION') {
    const preferredTimeline = optionalText(form, 'preferredTimeline')

    return {
      ...common,
      brief: String(form.get('brief') ?? '').trim(),
      ...(message ? {message} : {}),
      ...(preferredTimeline ? {preferredTimeline} : {}),
    }
  }

  if (props.type === 'PRIVATE_VIEWING') {
    const attendees = optionalText(form, 'attendees')
    const preferredDates = form
      .getAll('preferredDates')
      .map(value => String(value).trim())
      .filter(Boolean)

    return {
      ...common,
      ...(attendees ? {attendees: Number(attendees)} : {}),
      ...(message ? {message} : {}),
      preferredDates,
      ...(props.artwork ? {relatedArtworkId: props.artwork.id} : {}),
    }
  }

  return {
    ...common,
    message: String(form.get('message') ?? '').trim(),
    subject: String(form.get('subject') ?? '').trim(),
  }
}

export function fingerprintPublicInquiryPayload(payload: InquiryPayload) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(payload).filter(([key]) => key !== 'submissionId'),
    ),
  )
}
