'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'

import {z} from 'zod'

import {prisma} from '@/lib/db'
import {APP_LOCALES} from '@/lib/localized-path'
import {
  AuthenticationRequiredError,
  ResourceAccessDeniedError,
  requireOwnerOrAdminUser,
} from '@/server/auth/access'
import {uuidSchema} from '@/server/content/domain'

const nullableText = (maximum: number, minimum = 0) =>
  z.preprocess(
    value => {
      if (typeof value !== 'string') return value

      const normalized = value.trim()

      return normalized === '' ? null : normalized
    },
    z.string().min(minimum).max(maximum).nullable(),
  )

const nullableHttpsUrl = z.preprocess(
  value => {
    if (typeof value !== 'string') return value

    const normalized = value.trim()

    return normalized === '' ? null : normalized
  },
  z
    .string()
    .max(2048)
    .url()
    .refine(value => new URL(value).protocol === 'https:', {
      message: 'Only HTTPS URLs are allowed',
    })
    .nullable(),
)

const profileUpdateSchema = z
  .object({
    address: nullableText(300),
    bio: nullableText(2000),
    github: nullableHttpsUrl,
    instagram: nullableHttpsUrl,
    linkedin: nullableHttpsUrl,
    name: nullableText(100, 2),
    phone: nullableText(50),
    twitter: nullableHttpsUrl,
    website: nullableHttpsUrl,
  })
  .strict()

function localizedProfilePath(locale: string, id: string) {
  const safeLocale = z.enum(APP_LOCALES).parse(locale)
  const safeId = uuidSchema.parse(id)

  return `/${safeLocale}/profile/${safeId}`
}

export type ProfileFormState = Readonly<{
  errorCode: 'ACCESS_DENIED' | 'INVALID_INPUT' | 'SAVE_FAILED' | null
  fieldErrors?: Readonly<Record<string, readonly string[] | undefined>>
}>

export async function updateProfileAction(
  id: string,
  locale: string,
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  let profilePath: string

  try {
    profilePath = localizedProfilePath(locale, id)
  } catch {
    return {errorCode: 'INVALID_INPUT'}
  }

  try {
    await requireOwnerOrAdminUser(id)
  } catch (error) {
    if (
      error instanceof AuthenticationRequiredError ||
      error instanceof ResourceAccessDeniedError
    ) {
      return {errorCode: 'ACCESS_DENIED'}
    }

    throw error
  }

  const parsed = profileUpdateSchema.safeParse({
    address: formData.get('address'),
    bio: formData.get('bio'),
    github: formData.get('github'),
    instagram: formData.get('instagram'),
    linkedin: formData.get('linkedin'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    twitter: formData.get('twitter'),
    website: formData.get('website'),
  })

  if (!parsed.success) {
    return {
      errorCode: 'INVALID_INPUT',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    await prisma.user.update({data: parsed.data, where: {id}})
  } catch {
    console.error('Profile update failed')

    return {errorCode: 'SAVE_FAILED'}
  }

  revalidatePath(profilePath)
  redirect(profilePath)
}
