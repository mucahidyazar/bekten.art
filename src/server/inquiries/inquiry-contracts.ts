export type ArtworkInquirySnapshot = Readonly<{
  id: string
  locale: InquiryLocale
  slug: string
  title: string
  year: number | null
}>

export type AvailabilityInquiryRecord = InquiryRecordBase &
  Readonly<{
    message: string | null
    relatedArtworkSnapshot: ArtworkInquirySnapshot
    type: 'AVAILABILITY'
  }>

export type CollectorInquiryRecord = InquiryRecordBase &
  Readonly<{
    message: string
    relatedArtworkSnapshot: null
    subject: string
    type: 'COLLECTOR'
  }>

export type CommissionInquiryRecord = InquiryRecordBase &
  Readonly<{
    brief: string
    message: string | null
    preferredTimeline: string | null
    relatedArtworkSnapshot: null
    type: 'COMMISSION'
  }>

export type GeneralInquiryRecord = InquiryRecordBase &
  Readonly<{
    message: string
    relatedArtworkSnapshot: null
    subject: string
    type: 'GENERAL'
  }>

export type InquiryLocale = 'en' | 'tr' | 'ru' | 'ky'

export type InquiryRecord =
  | AvailabilityInquiryRecord
  | CollectorInquiryRecord
  | CommissionInquiryRecord
  | GeneralInquiryRecord
  | PrivateViewingInquiryRecord

export type InquiryRecordBase = Readonly<{
  abuseKeyHash: string
  consentedAt: Date
  createdAt: Date
  email: string
  erasePersonalDataAfter: Date
  id: string
  labels: readonly string[]
  locale: InquiryLocale
  name: string
  phone: string | null
  privacyNoticeVersion: string
  source: InquirySource
  status: InquiryStatus
  submissionId: string
  updatedAt: Date
}>

export type InquirySource = 'WEBSITE'

export type InquiryStatus =
  'ARCHIVED' | 'CLOSED' | 'IN_REVIEW' | 'NEW' | 'RESPONDED'

export type InquiryType =
  'AVAILABILITY' | 'COLLECTOR' | 'COMMISSION' | 'GENERAL' | 'PRIVATE_VIEWING'

export type PrivateViewingInquiryRecord = InquiryRecordBase &
  Readonly<{
    attendees: number | null
    message: string | null
    preferredDates: readonly string[]
    relatedArtworkSnapshot: ArtworkInquirySnapshot | null
    type: 'PRIVATE_VIEWING'
  }>
