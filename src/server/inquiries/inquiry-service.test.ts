import {describe, expect, it, vi} from 'vitest'

import {createInquiryService, InquirySubmissionError} from './inquiry-service'

import type {InquiryTransaction} from './inquiry-repository'

const now = new Date('2026-08-10T09:30:00.000Z')
const inquiryId = '123e4567-e89b-42d3-a456-426614174010'
const submissionId = '123e4567-e89b-42d3-a456-426614174000'
const artworkId = '123e4567-e89b-42d3-a456-426614174001'
const abuseKeyHash = 'a'.repeat(64)
const transaction = Object.freeze({scope: 'inquiry'}) as InquiryTransaction

const validInput = {
  consent: true,
  email: '  COLLECTOR@EXAMPLE.COM ',
  locale: 'en',
  message: 'Please share the viewing options for this work.',
  name: '  Ada Collector  ',
  relatedArtworkId: artworkId,
  submissionId,
  type: 'AVAILABILITY',
} as const

const submissionContext = {
  abuseKeyHash,
  source: 'WEBSITE',
} as const

function configuredService() {
  const repository = {
    addInternalNote: vi.fn(),
    create: vi.fn().mockResolvedValue('CREATED'),
    findRelatedArtworkSnapshot: vi.fn().mockResolvedValue(
      Object.freeze({
        id: artworkId,
        locale: 'en',
        slug: 'silent-valley',
        title: 'Silent Valley',
        year: 2025,
      }),
    ),
    replaceLabels: vi.fn(),
    updateStatus: vi.fn(),
  }
  const outbox = {enqueue: vi.fn().mockResolvedValue(undefined)}
  const audit = {record: vi.fn().mockResolvedValue(undefined)}
  const abuseGuard = {check: vi.fn().mockResolvedValue({allowed: true})}
  const unitOfWork = {
    execute: vi.fn(
      async <T>(work: (scope: InquiryTransaction) => Promise<T>) =>
        work(transaction),
    ),
  }
  const service = createInquiryService({
    abuseGuard,
    audit,
    clock: {now: () => now},
    idGenerator: {generate: () => inquiryId},
    outbox,
    privacyNoticeVersion: '2026-08-10',
    repository,
    retentionDays: 730,
    unitOfWork,
  })

  return {abuseGuard, audit, outbox, repository, service, unitOfWork}
}

describe('inquiry service', () => {
  it('stores an artwork snapshot and queues notification plus audit atomically', async () => {
    const {abuseGuard, audit, outbox, repository, service, unitOfWork} =
      configuredService()

    await expect(service.submit(validInput, submissionContext)).resolves.toEqual(
      {accepted: true},
    )

    expect(abuseGuard.check).toHaveBeenCalledWith({
      abuseKeyHash,
      at: now,
      submissionId,
    })
    expect(unitOfWork.execute).toHaveBeenCalledOnce()
    expect(repository.findRelatedArtworkSnapshot).toHaveBeenCalledWith(
      transaction,
      {id: artworkId, locale: 'en'},
    )
    expect(repository.create).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({
        abuseKeyHash,
        consentedAt: now,
        createdAt: now,
        email: 'collector@example.com',
        erasePersonalDataAfter: new Date('2028-08-09T09:30:00.000Z'),
        id: inquiryId,
        labels: [],
        name: 'Ada Collector',
        privacyNoticeVersion: '2026-08-10',
        relatedArtworkSnapshot: {
          id: artworkId,
          locale: 'en',
          slug: 'silent-valley',
          title: 'Silent Valley',
          year: 2025,
        },
        source: 'WEBSITE',
        status: 'NEW',
        submissionId,
        type: 'AVAILABILITY',
        updatedAt: now,
      }),
    )
    expect(outbox.enqueue).toHaveBeenCalledWith(transaction, {
      deduplicationKey: `inquiry.created:${inquiryId}`,
      payload: {inquiryId, locale: 'en', type: 'AVAILABILITY'},
      type: 'inquiry.created',
    })
    expect(audit.record).toHaveBeenCalledWith(transaction, {
      action: 'inquiry.created',
      metadata: {locale: 'en', type: 'AVAILABILITY'},
      targetId: inquiryId,
      targetType: 'inquiry',
    })
  })

  it('creates a commission without attempting to resolve an artwork', async () => {
    const {repository, service} = configuredService()

    await service.submit(
      {
        ...validInput,
        brief:
          'I would like to discuss an original landscape for a quiet reading room.',
        preferredTimeline: 'Autumn 2027',
        relatedArtworkId: undefined,
        type: 'COMMISSION',
      },
      submissionContext,
    )

    expect(repository.findRelatedArtworkSnapshot).not.toHaveBeenCalled()
    expect(repository.create).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({
        brief:
          'I would like to discuss an original landscape for a quiet reading room.',
        preferredTimeline: 'Autumn 2027',
        relatedArtworkSnapshot: null,
        type: 'COMMISSION',
      }),
    )
  })

  it('returns the same generic result for duplicate and missing-artwork submissions', async () => {
    const duplicate = configuredService()
    const missing = configuredService()

    duplicate.repository.create.mockResolvedValueOnce('DUPLICATE')
    missing.repository.findRelatedArtworkSnapshot.mockResolvedValueOnce(null)

    await expect(
      duplicate.service.submit(validInput, submissionContext),
    ).resolves.toEqual({accepted: true})
    await expect(
      missing.service.submit(validInput, submissionContext),
    ).resolves.toEqual({accepted: true})
    expect(duplicate.outbox.enqueue).not.toHaveBeenCalled()
    expect(duplicate.audit.record).not.toHaveBeenCalled()
    expect(missing.repository.create).not.toHaveBeenCalled()
    expect(missing.outbox.enqueue).not.toHaveBeenCalled()
  })

  it('accepts abuse-blocked submissions without starting a transaction', async () => {
    const {abuseGuard, service, unitOfWork} = configuredService()

    abuseGuard.check.mockResolvedValueOnce({allowed: false})

    await expect(service.submit(validInput, submissionContext)).resolves.toEqual(
      {accepted: true},
    )
    expect(unitOfWork.execute).not.toHaveBeenCalled()
  })

  it('rejects invalid public or trusted context without exposing validation details', async () => {
    const {repository, service} = configuredService()

    await expect(
      service.submit({...validInput, status: 'CLOSED'}, submissionContext),
    ).rejects.toThrow('INQUIRY_INPUT_INVALID')
    await expect(
      service.submit(validInput, {
        ...submissionContext,
        abuseKeyHash: 'raw-address',
      }),
    ).rejects.toThrow('INQUIRY_CONTEXT_INVALID')
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('wraps infrastructure failures in a stable non-secret error', async () => {
    const {service, unitOfWork} = configuredService()

    unitOfWork.execute.mockRejectedValueOnce(
      new Error('postgresql://private-user:private-password@database'),
    )

    const result = service.submit(validInput, submissionContext)

    await expect(result).rejects.toBeInstanceOf(InquirySubmissionError)
    await expect(result).rejects.toThrow('INQUIRY_SUBMISSION_FAILED')
    await expect(result).rejects.not.toThrow('private-password')
  })
})
