import {describe, expect, it, vi} from 'vitest'

import {createPublicContactRepository} from './public-contact'

describe('public contact repository', () => {
  it('prefers locale-specific typed contact information', async () => {
    const findContact = vi.fn().mockResolvedValue({
      address: 'Bishkek',
      email: 'studio@example.com',
      instagramUrl: 'https://instagram.com/bekten',
      isPrimary: true,
      locale: 'en',
      mapEmbedUrl: 'https://maps.example.com/embed',
      phone: '+996 555 000 000',
      workingHours: '{"Monday":"09:00–18:00"}',
    })
    const repository = createPublicContactRepository({
      contactInfo: {findFirst: findContact},
    })

    await expect(repository.find('en')).resolves.toEqual({
      address: 'Bishkek',
      email: 'studio@example.com',
      mapEmbedUrl: 'https://maps.example.com/embed',
      name: null,
      phone: '+996 555 000 000',
      socials: [
        {
          id: 'contact-instagram',
          platform: 'instagram',
          url: 'https://instagram.com/bekten',
        },
      ],
      workingHours: '{"Monday":"09:00–18:00"}',
    })
    expect(findContact).toHaveBeenCalledWith(
      expect.objectContaining({where: {locale: 'en'}}),
    )
  })

  it('returns no contact details when typed backfill has no published source', async () => {
    const findContact = vi.fn().mockResolvedValue(null)
    const repository = createPublicContactRepository({
      contactInfo: {findFirst: findContact},
    })

    await expect(repository.find('ky')).resolves.toBeNull()
    expect(findContact).toHaveBeenCalledTimes(2)
  })
})
