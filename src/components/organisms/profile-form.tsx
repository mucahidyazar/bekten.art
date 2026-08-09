'use client'

import Link from 'next/link'

import {useActionState} from 'react'
import {useFormStatus} from 'react-dom'

import {Button, buttonVariants} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'

import type {ProfileFormState} from '@/app/[locale]/(root)/profile/[id]/edit/actions'
import type {AppLocale} from '@/lib/localized-path'

export type EditableProfile = Readonly<{
  address: string | null
  bio: string | null
  github: string | null
  id: string
  instagram: string | null
  name: string | null
  linkedin: string | null
  phone: string | null
  twitter: string | null
  website: string | null
}>

type ProfileFormProps = Readonly<{
  action: (
    previousState: ProfileFormState,
    formData: FormData,
  ) => Promise<ProfileFormState>
  locale: AppLocale
  profile: EditableProfile
}>

type FieldProps = Readonly<{
  autoComplete?: string
  defaultValue: string | null
  label: string
  name: keyof Omit<EditableProfile, 'id'>
  invalid?: boolean
  invalidMessage: string
  placeholder?: string
  type?: 'text' | 'tel' | 'url'
}>

function ProfileField({
  autoComplete,
  defaultValue,
  label,
  name,
  invalid = false,
  invalidMessage,
  placeholder,
  type = 'text',
}: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        aria-describedby={invalid ? `${name}-error` : undefined}
        aria-invalid={invalid || undefined}
        autoComplete={autoComplete}
        defaultValue={defaultValue ?? ''}
        id={name}
        maxLength={type === 'url' ? 2048 : 300}
        name={name}
        placeholder={placeholder}
        type={type}
      />
      {invalid ? (
        <p className="text-destructive text-sm" id={`${name}-error`}>
          {invalidMessage}
        </p>
      ) : null}
    </div>
  )
}

function SubmitButton({labels}: Readonly<{labels: {save: string; saving: string}}>) {
  const {pending} = useFormStatus()

  return (
    <Button disabled={pending} type="submit">
      {pending ? labels.saving : labels.save}
    </Button>
  )
}

export function ProfileForm({action, locale, profile}: ProfileFormProps) {
  const labels = profileCopy[locale]
  const [state, formAction] = useActionState(action, {errorCode: null})
  const invalid = (name: keyof Omit<EditableProfile, 'id'>) =>
    Boolean(state.fieldErrors?.[name]?.length)

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <ProfileField
          autoComplete="name"
          defaultValue={profile.name}
          invalid={invalid('name')}
          invalidMessage={labels.invalidField}
          label={labels.name}
          name="name"
        />
        <ProfileField
          autoComplete="tel"
          defaultValue={profile.phone}
          invalid={invalid('phone')}
          invalidMessage={labels.invalidField}
          label={labels.phone}
          name="phone"
          type="tel"
        />
        <ProfileField
          autoComplete="street-address"
          defaultValue={profile.address}
          invalid={invalid('address')}
          invalidMessage={labels.invalidField}
          label={labels.address}
          name="address"
        />
        <ProfileField
          autoComplete="url"
          defaultValue={profile.website}
          invalid={invalid('website')}
          invalidMessage={labels.invalidField}
          label={labels.website}
          name="website"
          placeholder="https://example.com"
          type="url"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">{labels.biography}</Label>
        <Textarea
          aria-describedby={invalid('bio') ? 'bio-error' : undefined}
          aria-invalid={invalid('bio') || undefined}
          defaultValue={profile.bio ?? ''}
          id="bio"
          maxLength={2000}
          name="bio"
          rows={7}
        />
        {invalid('bio') ? (
          <p className="text-destructive text-sm" id="bio-error">
            {labels.invalidField}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-4 rounded-xl border p-4">
        <legend className="px-2 text-sm font-medium">{labels.socialLinks}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <ProfileField
            defaultValue={profile.instagram}
            invalid={invalid('instagram')}
            invalidMessage={labels.invalidField}
            label={labels.instagram}
            name="instagram"
            placeholder="https://instagram.com/…"
            type="url"
          />
          <ProfileField
            defaultValue={profile.twitter}
            invalid={invalid('twitter')}
            invalidMessage={labels.invalidField}
            label={labels.twitter}
            name="twitter"
            placeholder="https://x.com/…"
            type="url"
          />
          <ProfileField
            defaultValue={profile.linkedin}
            invalid={invalid('linkedin')}
            invalidMessage={labels.invalidField}
            label={labels.linkedin}
            name="linkedin"
            placeholder="https://linkedin.com/in/…"
            type="url"
          />
          <ProfileField
            defaultValue={profile.github}
            invalid={invalid('github')}
            invalidMessage={labels.invalidField}
            label={labels.github}
            name="github"
            placeholder="https://github.com/…"
            type="url"
          />
        </div>
      </fieldset>

      {state.errorCode ? (
        <p className="text-destructive text-sm" role="alert">
          {labels.errors[state.errorCode]}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <SubmitButton labels={labels} />
        <Link
          className={buttonVariants({variant: 'outline'})}
          href={`/${locale}/profile/${profile.id}`}
        >
          {labels.cancel}
        </Link>
      </div>
    </form>
  )
}

const profileCopy = {
  en: {
    address: 'Address',
    biography: 'Biography',
    cancel: 'Cancel',
    errors: {
      ACCESS_DENIED: 'Your session no longer permits this change. Sign in again.',
      INVALID_INPUT: 'Check the highlighted fields and try again.',
      SAVE_FAILED: 'We could not save your profile. Please try again.',
    },
    github: 'GitHub URL',
    instagram: 'Instagram URL',
    invalidField: 'Enter a valid value.',
    linkedin: 'LinkedIn URL',
    name: 'Name',
    phone: 'Phone',
    save: 'Save profile',
    saving: 'Saving…',
    socialLinks: 'Social links',
    twitter: 'X / Twitter URL',
    website: 'Website',
  },
  ky: {
    address: 'Дарек',
    biography: 'Өмүр баян',
    cancel: 'Жокко чыгаруу',
    errors: {
      ACCESS_DENIED: 'Сеансыңыз бул өзгөртүүгө уруксат бербейт. Кайра кириңиз.',
      INVALID_INPUT: 'Белгиленген талааларды текшерип, кайра аракет кылыңыз.',
      SAVE_FAILED: 'Профилди сактай алган жокпуз. Кайра аракет кылыңыз.',
    },
    github: 'GitHub URL',
    instagram: 'Instagram URL',
    invalidField: 'Туура маани киргизиңиз.',
    linkedin: 'LinkedIn URL',
    name: 'Аты',
    phone: 'Телефон',
    save: 'Профилди сактоо',
    saving: 'Сакталууда…',
    socialLinks: 'Социалдык шилтемелер',
    twitter: 'X / Twitter URL',
    website: 'Веб-сайт',
  },
  ru: {
    address: 'Адрес',
    biography: 'Биография',
    cancel: 'Отмена',
    errors: {
      ACCESS_DENIED: 'Сеанс больше не разрешает это изменение. Войдите снова.',
      INVALID_INPUT: 'Проверьте отмеченные поля и повторите попытку.',
      SAVE_FAILED: 'Не удалось сохранить профиль. Попробуйте ещё раз.',
    },
    github: 'GitHub URL',
    instagram: 'Instagram URL',
    invalidField: 'Введите корректное значение.',
    linkedin: 'LinkedIn URL',
    name: 'Имя',
    phone: 'Телефон',
    save: 'Сохранить профиль',
    saving: 'Сохранение…',
    socialLinks: 'Социальные ссылки',
    twitter: 'X / Twitter URL',
    website: 'Веб-сайт',
  },
  tr: {
    address: 'Adres',
    biography: 'Biyografi',
    cancel: 'İptal',
    errors: {
      ACCESS_DENIED: 'Oturumunuz bu değişikliğe artık izin vermiyor. Tekrar giriş yapın.',
      INVALID_INPUT: 'İşaretli alanları kontrol edip tekrar deneyin.',
      SAVE_FAILED: 'Profilinizi kaydedemedik. Lütfen tekrar deneyin.',
    },
    github: 'GitHub URL',
    instagram: 'Instagram URL',
    invalidField: 'Geçerli bir değer girin.',
    linkedin: 'LinkedIn URL',
    name: 'Ad',
    phone: 'Telefon',
    save: 'Profili kaydet',
    saving: 'Kaydediliyor…',
    socialLinks: 'Sosyal bağlantılar',
    twitter: 'X / Twitter URL',
    website: 'Web sitesi',
  },
} as const
