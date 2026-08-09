import {beforeEach, describe, expect, it, vi} from 'vitest'

const mocks = vi.hoisted(() => ({
  auditCreate: vi.fn(),
  findUnique: vi.fn(),
  requireAdminUser: vi.fn(),
  requireRecentAdminUser: vi.fn(),
  transaction: vi.fn(),
  upsert: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: mocks.transaction,
    contactInfo: {findUnique: mocks.findUnique},
  },
}))

vi.mock('@/server/auth/access', () => {
  class AdminAccessRequiredError extends Error {}
  class AuthenticationRequiredError extends Error {}
  class RecentAuthenticationRequiredError extends Error {}

  return {
    AdminAccessRequiredError,
    AuthenticationRequiredError,
    RecentAuthenticationRequiredError,
    requireAdminUser: mocks.requireAdminUser,
    requireRecentAdminUser: mocks.requireRecentAdminUser,
  }
})

import {
  AuthenticationRequiredError,
  RecentAuthenticationRequiredError,
} from '@/server/auth/access'

import {GET, POST} from './route'

const contact = {
  address: 'Bishkek',
  email: 'support@mucahid.dev',
  id: '018f24dd-c0b7-7a0a-879e-0528df355f2c',
  instagramUrl: 'https://instagram.com/bekten',
  isPrimary: true,
  locale: 'en',
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=test',
  phone: '+996 555 000 000',
  updatedAt: new Date('2026-08-09T12:00:00.000Z'),
  workingHours: 'Monday–Friday 09:00–18:00',
}

describe('/api/cms/contact-info', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bekten.art')
    mocks.requireAdminUser.mockResolvedValue({id: 'admin', role: 'ADMIN'})
    mocks.requireRecentAdminUser.mockResolvedValue({id: 'admin', role: 'ADMIN'})
    mocks.findUnique.mockResolvedValue(contact)
    mocks.upsert.mockResolvedValue(contact)
    mocks.transaction.mockImplementation(callback =>
      callback({
        auditEvent: {create: mocks.auditCreate},
        contactInfo: {upsert: mocks.upsert},
      }),
    )
  })

  it('returns localized typed contact data only to an admin', async () => {
    const response = await GET(
      new Request('https://bekten.art/api/cms/contact-info?locale=en'),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      contactInfo: {email: 'support@mucahid.dev', locale: 'en'},
    })
    expect(mocks.findUnique).toHaveBeenCalledWith({where: {locale: 'en'}})
  })

  it('maps missing authentication to a safe response', async () => {
    mocks.requireAdminUser.mockRejectedValue(new AuthenticationRequiredError())

    const response = await GET(
      new Request('https://bekten.art/api/cms/contact-info'),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'Authentication required',
    })
  })

  it('rejects cross-origin mutation before recent-auth and database access', async () => {
    const response = await POST(
      new Request('https://bekten.art/api/cms/contact-info', {
        body: JSON.stringify(contact),
        headers: {
          'content-type': 'application/json',
          origin: 'https://attacker.example',
        },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(403)
    expect(mocks.requireRecentAdminUser).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('upserts validated contact data and writes an audit event atomically', async () => {
    const input = {
      address: contact.address,
      email: contact.email,
      instagramUrl: contact.instagramUrl,
      isPrimary: true,
      locale: 'en',
      mapEmbedUrl: contact.mapEmbedUrl,
      phone: contact.phone,
      workingHours: contact.workingHours,
    }
    const response = await POST(
      new Request('https://bekten.art/api/cms/contact-info', {
        body: JSON.stringify(input),
        headers: {
          'content-type': 'application/json',
          origin: 'https://bekten.art',
        },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(200)
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({where: {locale: 'en'}}),
    )
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({action: 'contact.updated'}),
      }),
    )
  })

  it('rejects invalid contact input and stale privileged sessions', async () => {
    const request = (body: unknown) =>
      new Request('https://bekten.art/api/cms/contact-info', {
        body: JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
          origin: 'https://bekten.art',
        },
        method: 'POST',
      })

    const invalid = await POST(request({email: 'invalid'}))

    expect(invalid.status).toBe(400)

    mocks.requireRecentAdminUser.mockRejectedValueOnce(
      new RecentAuthenticationRequiredError(),
    )
    const stale = await POST(request(contact))

    expect(stale.status).toBe(403)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
})
