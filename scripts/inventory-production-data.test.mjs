import {describe, expect, it} from 'vitest'

import {PRODUCTION_DATA_TABLES} from './inventory-production-data.mjs'

describe('production data inventory', () => {
  it('covers every V2 content, inquiry, media and operational table', () => {
    expect(PRODUCTION_DATA_TABLES).toEqual(
      expect.arrayContaining([
        'artworks',
        'collections',
        'exhibitions',
        'exhibition_artworks',
        'journal_entries',
        'pages',
        'content_media_placements',
        'content_revisions',
        'inquiries',
        'inquiry_internal_notes',
        'audit_events',
        'outbox_jobs',
        'email_webhook_events',
        'auth_rate_limits',
        'ui_translation_overrides',
      ]),
    )
    expect(new Set(PRODUCTION_DATA_TABLES).size).toBe(
      PRODUCTION_DATA_TABLES.length,
    )
  })
})
