import {unstable_noStore as noStore} from 'next/cache'

import {prisma} from '@/lib/db'

type AppLocale = 'en' | 'tr' | 'ru' | 'ky'

type ContactRow = Readonly<{
  address: string
  email: string
  instagramUrl: string | null
  mapEmbedUrl: string | null
  phone: string
  workingHours: string | null
}>

type ContactDatabase = Readonly<{
  contactInfo: Readonly<{
    findFirst: (args: unknown) => Promise<ContactRow | null>
  }>
}>

export type PublicContact = Readonly<{
  address: string
  email: string
  mapEmbedUrl: string | null
  name: string | null
  phone: string
  socials: readonly Readonly<{id: string; platform: string; url: string}>[]
  workingHours: string | null
}>

function safeHttpsUrl(value: string | null) {
  if (!value) return null

  try {
    const url = new URL(value)

    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function typedContact(row: ContactRow): PublicContact {
  const instagramUrl = safeHttpsUrl(row.instagramUrl)

  return Object.freeze({
    address: row.address,
    email: row.email,
    mapEmbedUrl: safeHttpsUrl(row.mapEmbedUrl),
    name: null,
    phone: row.phone,
    socials: Object.freeze(
      instagramUrl
        ? [
            Object.freeze({
              id: 'contact-instagram',
              platform: 'instagram',
              url: instagramUrl,
            }),
          ]
        : [],
    ),
    workingHours: row.workingHours,
  })
}

export function createPublicContactRepository(database: ContactDatabase) {
  return Object.freeze({
    async find(locale: AppLocale): Promise<PublicContact | null> {
      const localized = await database.contactInfo.findFirst({
        where: {locale},
      })

      if (localized) return typedContact(localized)

      const primary = await database.contactInfo.findFirst({
        orderBy: {updatedAt: 'desc'},
        where: {isPrimary: true},
      })

      if (primary) return typedContact(primary)

      return null
    },
  })
}

export async function getPublicContactInfo(locale: AppLocale) {
  noStore()

  return createPublicContactRepository({
    contactInfo: prisma.contactInfo,
  } as unknown as ContactDatabase).find(locale)
}
