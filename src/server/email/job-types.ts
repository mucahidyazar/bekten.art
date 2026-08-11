export const TRANSACTIONAL_EMAIL_JOB_TYPES = Object.freeze([
  'feedback.created',
  'newsletter.confirmation_requested',
  'newsletter.welcome',
  'studio.magic-link.requested',
] as const)

export type TransactionalEmailJobType =
  (typeof TRANSACTIONAL_EMAIL_JOB_TYPES)[number]
