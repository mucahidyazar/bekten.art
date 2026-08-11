import {describe, expect, it, vi} from 'vitest'

import {
  assertDashboardEditorUpsertAllowed,
  normalizeDashboardEditorEmail,
  upsertDashboardEditor,
} from './upsert-dashboard-editor.mjs'

const normalizedEmail = 'mucahidyazar@gmail.com'

describe('dashboard editor upsert', () => {
  it('normalizes the explicitly configured editor email', () => {
    expect(normalizeDashboardEditorEmail('  MUCAHIDYAZAR@gmail.com  ')).toBe(
      normalizedEmail,
    )
  })

  it.each([
    '',
    'not-an-email',
    'editor@example.com\nBcc: attacker@example.com',
    `${'a'.repeat(250)}@example.com`,
  ])('rejects an unsafe editor identity: %j', email => {
    expect(() => normalizeDashboardEditorEmail(email)).toThrow(
      'DASHBOARD_EDITOR_EMAIL_INVALID',
    )
  })

  it('requires both the opt-in flag and an email-bound confirmation', () => {
    expect(() =>
      assertDashboardEditorUpsertAllowed({
        DASHBOARD_EDITOR_EMAIL: normalizedEmail,
      }),
    ).toThrow('DASHBOARD_EDITOR_UPSERT_NOT_AUTHORIZED')
    expect(() =>
      assertDashboardEditorUpsertAllowed({
        ALLOW_DASHBOARD_EDITOR_UPSERT: 'true',
        DASHBOARD_EDITOR_EMAIL: normalizedEmail,
      }),
    ).toThrow('DASHBOARD_EDITOR_UPSERT_NOT_AUTHORIZED')
    expect(() =>
      assertDashboardEditorUpsertAllowed({
        ALLOW_DASHBOARD_EDITOR_UPSERT: 'true',
        DASHBOARD_EDITOR_EMAIL: normalizedEmail,
        DASHBOARD_EDITOR_UPSERT_CONFIRMATION:
          'grant-editor:somebody-else@example.com',
      }),
    ).toThrow('DASHBOARD_EDITOR_UPSERT_NOT_AUTHORIZED')

    expect(
      assertDashboardEditorUpsertAllowed({
        ALLOW_DASHBOARD_EDITOR_UPSERT: 'true',
        DASHBOARD_EDITOR_EMAIL: ` ${normalizedEmail.toUpperCase()} `,
        DASHBOARD_EDITOR_UPSERT_CONFIRMATION: `grant-editor:${normalizedEmail}`,
      }),
    ).toBe(normalizedEmail)
  })

  it('idempotently grants EDITOR without creating password credentials', async () => {
    const updateMany = vi.fn().mockResolvedValue({count: 1})
    const upsert = vi.fn().mockResolvedValue({
      email: normalizedEmail,
      id: '10000000-0000-4000-8000-000000000001',
      role: 'EDITOR',
    })
    const transaction = {user: {updateMany, upsert}}
    const database = {
      $transaction: vi.fn(callback => callback(transaction)),
    }

    await upsertDashboardEditor(database, normalizedEmail)
    await upsertDashboardEditor(database, normalizedEmail)

    expect(updateMany).toHaveBeenNthCalledWith(1, {
      data: {role: 'EDITOR'},
      where: {email: normalizedEmail, role: {notIn: ['OWNER', 'ADMIN']}},
    })
    expect(upsert).toHaveBeenCalledTimes(2)
    expect(upsert).toHaveBeenNthCalledWith(1, {
      create: {email: normalizedEmail, role: 'EDITOR'},
      select: {email: true, role: true},
      update: {},
      where: {email: normalizedEmail},
    })
    expect(JSON.stringify(upsert.mock.calls)).not.toMatch(
      /password|emailVerified/u,
    )
  })

  it.each(['OWNER', 'ADMIN'])('never demotes an existing %s', async role => {
    const transaction = {
      user: {
        updateMany: vi.fn().mockResolvedValue({count: 0}),
        upsert: vi.fn().mockResolvedValue({email: normalizedEmail, role}),
      },
    }
    const database = {$transaction: vi.fn(callback => callback(transaction))}

    await expect(
      upsertDashboardEditor(database, normalizedEmail),
    ).resolves.toEqual({email: normalizedEmail, role})
    expect(transaction.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({update: {}}),
    )
  })
})
