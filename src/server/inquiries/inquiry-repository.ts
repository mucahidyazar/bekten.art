import type {
  ArtworkInquirySnapshot,
  InquiryLocale,
  InquiryRecord,
  InquiryStatus,
  InquiryType,
} from './inquiry-contracts'

export type InquiryAuditEvent = Readonly<{
  action: 'inquiry.created'
  metadata: Readonly<{locale: InquiryLocale; type: InquiryType}>
  targetId: string
  targetType: 'inquiry'
}>

export interface InquiryAuditWriter {
  record(
    transaction: InquiryTransaction,
    event: InquiryAuditEvent,
  ): Promise<void>
}

export type InquiryCreateResult = 'CREATED' | 'DUPLICATE'

export type InquiryInternalNote = Readonly<{
  authorId: string
  body: string
  createdAt: Date
  id: string
  inquiryId: string
}>

export interface InquiryManagementRepository {
  addInternalNote(
    transaction: InquiryTransaction,
    note: InquiryInternalNote,
  ): Promise<void>
  replaceLabels(
    transaction: InquiryTransaction,
    input: Readonly<{inquiryId: string; labels: readonly string[]}>,
  ): Promise<void>
  updateStatus(
    transaction: InquiryTransaction,
    input: Readonly<{
      inquiryId: string
      status: InquiryStatus
      updatedAt: Date
    }>,
  ): Promise<void>
}

export type InquiryNotificationJob = Readonly<{
  deduplicationKey: string
  payload: Readonly<{
    inquiryId: string
    locale: InquiryLocale
    type: InquiryType
  }>
  type: 'inquiry.created'
}>

export interface InquiryOutboxWriter {
  enqueue(
    transaction: InquiryTransaction,
    job: InquiryNotificationJob,
  ): Promise<void>
}

export interface InquirySubmissionRepository {
  create(
    transaction: InquiryTransaction,
    inquiry: InquiryRecord,
  ): Promise<InquiryCreateResult>
  findRelatedArtworkSnapshot(
    transaction: InquiryTransaction,
    query: Readonly<{id: string; locale: InquiryLocale}>,
  ): Promise<ArtworkInquirySnapshot | null>
}

export type InquiryTransaction = Readonly<{scope: string}>

export interface InquiryUnitOfWork {
  execute<T>(work: (transaction: InquiryTransaction) => Promise<T>): Promise<T>
}
