import {describe, expect, it} from 'vitest'

import {
  inquiryLabelSchema,
  inquiryStatusSchema,
  publicInquiryInputSchema,
} from './inquiry-validation'

const submissionId = '123e4567-e89b-42d3-a456-426614174000'
const artworkId = '123e4567-e89b-42d3-a456-426614174001'

const sharedInput = {
  consent: true,
  email: '  COLLECTOR@EXAMPLE.COM ',
  locale: 'en',
  name: '  Ada Collector  ',
  phone: ' +44 20 7946 0958 ',
  submissionId,
} as const

describe('public inquiry validation', () => {
  it.each([
    {
      expectedType: 'AVAILABILITY',
      input: {
        ...sharedInput,
        message: 'Please share the viewing options for this work.',
        relatedArtworkId: artworkId,
        type: 'AVAILABILITY',
      },
    },
    {
      expectedType: 'COMMISSION',
      input: {
        ...sharedInput,
        brief:
          'I would like to discuss an original landscape for a quiet reading room.',
        preferredTimeline: 'Autumn 2027',
        type: 'COMMISSION',
      },
    },
    {
      expectedType: 'PRIVATE_VIEWING',
      input: {
        ...sharedInput,
        attendees: 2,
        message: 'A morning appointment would be ideal.',
        preferredDates: ['2027-05-20', '2027-05-21'],
        relatedArtworkId: artworkId,
        type: 'PRIVATE_VIEWING',
      },
    },
    {
      expectedType: 'GENERAL',
      input: {
        ...sharedInput,
        message: 'I would like to learn more about the studio archive.',
        subject: 'Studio archive',
        type: 'GENERAL',
      },
    },
  ])(
    'accepts and normalizes $expectedType inquiries',
    ({expectedType, input}) => {
      const parsed = publicInquiryInputSchema.parse(input)

      expect(parsed.type).toBe(expectedType)
      expect(parsed.email).toBe('collector@example.com')
      expect(parsed.name).toBe('Ada Collector')
      expect(parsed.phone).toBe('+44 20 7946 0958')
    },
  )

  it('requires explicit privacy consent', () => {
    const result = publicInquiryInputSchema.safeParse({
      ...sharedInput,
      consent: false,
      message: 'Please share more information about this work.',
      relatedArtworkId: artworkId,
      type: 'AVAILABILITY',
    })

    expect(result.success).toBe(false)
  })

  it.each([
    'status',
    'labels',
    'internalNotes',
    'privacyNoticeVersion',
    'retainUntil',
  ])('does not let public callers set the internal %s field', field => {
    const result = publicInquiryInputSchema.safeParse({
      ...sharedInput,
      [field]: 'caller-controlled',
      message: 'Please share more information about this work.',
      relatedArtworkId: artworkId,
      type: 'AVAILABILITY',
    })

    expect(result.success).toBe(false)
  })

  it('enforces type-specific fields instead of accepting an ambiguous request', () => {
    expect(
      publicInquiryInputSchema.safeParse({
        ...sharedInput,
        message: 'I would like to discuss a new work for my home.',
        type: 'COMMISSION',
      }).success,
    ).toBe(false)
    expect(
      publicInquiryInputSchema.safeParse({
        ...sharedInput,
        message: 'Please share more information about this work.',
        type: 'AVAILABILITY',
      }).success,
    ).toBe(false)
  })

  it('bounds contact and message data before it reaches persistence', () => {
    const result = publicInquiryInputSchema.safeParse({
      ...sharedInput,
      email: `${'a'.repeat(310)}@example.com`,
      message: 'x'.repeat(4_001),
      subject: 'General',
      type: 'GENERAL',
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid or excessive private-viewing dates and attendee counts', () => {
    expect(
      publicInquiryInputSchema.safeParse({
        ...sharedInput,
        attendees: 0,
        preferredDates: ['2027-02-30'],
        type: 'PRIVATE_VIEWING',
      }).success,
    ).toBe(false)
    expect(
      publicInquiryInputSchema.safeParse({
        ...sharedInput,
        preferredDates: [
          '2027-05-20',
          '2027-05-21',
          '2027-05-22',
          '2027-05-23',
        ],
        type: 'PRIVATE_VIEWING',
      }).success,
    ).toBe(false)
  })
})

describe('Studio-only inquiry validation', () => {
  it('defines bounded status and label values for the future authorized inbox', () => {
    expect(inquiryStatusSchema.options).toEqual([
      'NEW',
      'IN_REVIEW',
      'RESPONDED',
      'CLOSED',
      'ARCHIVED',
    ])
    expect(inquiryLabelSchema.parse('priority-collector')).toBe(
      'priority-collector',
    )
    expect(inquiryLabelSchema.safeParse('Not URL Safe').success).toBe(false)
  })
})
