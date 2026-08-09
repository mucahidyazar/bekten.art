// @vitest-environment jsdom

import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {updateProfileAction} from './actions'
import ProfileEditPage from './page'

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
  requireOwnerOrAdminUser: vi.fn(),
  revalidatePath: vi.fn(),
  update: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {findUnique: mocks.findUnique, update: mocks.update},
  },
}))
vi.mock('@/server/auth/access', () => ({
  requireOwnerOrAdminUser: mocks.requireOwnerOrAdminUser,
}))
vi.mock('next/cache', () => ({revalidatePath: mocks.revalidatePath}))
vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}))

describe('profile editing', () => {
  const ownerId = '018f24dd-c0b7-7a0a-879e-0528df355f2c'

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireOwnerOrAdminUser.mockResolvedValue({
      id: ownerId,
      role: 'USER',
    })
  })

  it('loads only editable profile fields after owner authorization', async () => {
    mocks.findUnique.mockResolvedValue({
      address: 'Bishkek',
      bio: 'Painter',
      github: null,
      id: ownerId,
      instagram: 'https://instagram.com/bekten',
      linkedin: null,
      name: 'Bekten',
      phone: '+996 555 000 000',
      twitter: null,
      website: 'https://bekten.art',
    })

    render(
      await ProfileEditPage({
        params: Promise.resolve({id: ownerId, locale: 'en'}),
      }),
    )

    expect(mocks.requireOwnerOrAdminUser).toHaveBeenCalledWith(ownerId)
    expect(screen.getByRole('heading', {name: /edit profile/i})).toBeVisible()
    expect(screen.getByLabelText('Name')).toHaveValue('Bekten')
    expect(screen.getByLabelText('Website')).toHaveValue('https://bekten.art')
    expect(screen.getByRole('button', {name: /save profile/i})).toBeVisible()
  })

  it('validates and persists normalized profile data for the authorized owner', async () => {
    mocks.update.mockResolvedValue({id: ownerId})
    const formData = new FormData()

    formData.set('name', '  Bekten Usubaliev  ')
    formData.set('bio', '  Contemporary Kyrgyz artist  ')
    formData.set('address', '')
    formData.set('phone', '')
    formData.set('website', 'https://bekten.art')
    formData.set('instagram', 'https://instagram.com/bekten')
    formData.set('twitter', '')
    formData.set('linkedin', '')
    formData.set('github', '')

    await updateProfileAction(ownerId, 'tr', {errorCode: null}, formData)

    expect(mocks.requireOwnerOrAdminUser).toHaveBeenCalledWith(ownerId)
    expect(mocks.update).toHaveBeenCalledWith({
      data: {
        address: null,
        bio: 'Contemporary Kyrgyz artist',
        github: null,
        instagram: 'https://instagram.com/bekten',
        linkedin: null,
        name: 'Bekten Usubaliev',
        phone: null,
        twitter: null,
        website: 'https://bekten.art',
      },
      where: {id: ownerId},
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/tr/profile/${ownerId}`)
    expect(mocks.redirect).toHaveBeenCalledWith(`/tr/profile/${ownerId}`)
  })

  it('rejects unsafe website protocols before writing', async () => {
    const formData = new FormData()

    formData.set('name', 'Bekten')
    formData.set('website', 'javascript:alert(1)')

    await expect(
      updateProfileAction(ownerId, 'en', {errorCode: null}, formData),
    ).resolves.toMatchObject({
      errorCode: 'INVALID_INPUT',
      fieldErrors: {website: expect.any(Array)},
    })
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('returns a safe form-level error when persistence fails', async () => {
    mocks.update.mockRejectedValueOnce(new Error('database host and secret'))
    const formData = new FormData()

    formData.set('name', 'Bekten')

    await expect(
      updateProfileAction(ownerId, 'en', {errorCode: null}, formData),
    ).resolves.toEqual({errorCode: 'SAVE_FAILED'})
  })
})
