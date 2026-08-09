export const TRANSACTIONAL_EMAIL_JOB_TYPES = Object.freeze([
  'auth.email_verification',
  'auth.password_reset',
  'feedback.created',
  'newsletter.confirmation_requested',
  'newsletter.welcome',
] as const)

export type TransactionalEmailJobType =
  (typeof TRANSACTIONAL_EMAIL_JOB_TYPES)[number]
