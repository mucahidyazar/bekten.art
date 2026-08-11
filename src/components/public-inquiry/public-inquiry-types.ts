export type PublicInquiryArtwork = Readonly<{
  id: string
  medium?: string | null
  title: string
  year?: number | null
}>

export type PublicInquiryFormProps = Readonly<{
  className?: string
  locale: PublicInquiryLocale
  privacyPolicyHref?: string
}> &
  (
    | Readonly<{
        artwork: PublicInquiryArtwork
        type: 'AVAILABILITY'
      }>
    | Readonly<{
        artwork?: PublicInquiryArtwork
        type: 'PRIVATE_VIEWING'
      }>
    | Readonly<{
        type: 'COMMISSION' | 'GENERAL'
      }>
  )

export type PublicInquiryLocale = 'en' | 'ky' | 'ru' | 'tr'

export type PublicInquiryType =
  'AVAILABILITY' | 'COMMISSION' | 'GENERAL' | 'PRIVATE_VIEWING'
