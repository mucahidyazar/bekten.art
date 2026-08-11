import {z} from 'zod'

import {siteLocaleCodeSchema} from '@/server/site-locales/site-locale-service'

import {validateTranslationKey} from './translation-catalog'

import type {
  ReplaceTranslationKeyInput,
  StoredTranslationOverride,
  TranslationLocale,
  TranslationRepository,
} from './translation-service'

type TranslationTransaction = Readonly<{
  auditEvent: Readonly<{create: (args: unknown) => Promise<unknown>}>
  uiTranslationOverride: Readonly<{
    createMany: (args: unknown) => Promise<unknown>
    deleteMany: (args: unknown) => Promise<unknown>
  }>
}>
type TranslationDatabase = Readonly<{
  $transaction: <Result>(
    callback: (transaction: TranslationTransaction) => Promise<Result>,
  ) => Promise<Result>
  uiTranslationOverride: Readonly<{
    findMany: (args: unknown) => Promise<unknown>
  }>
}>

const localeSchema = siteLocaleCodeSchema
const keySchema = z
  .string()
  .min(1)
  .max(300)
  .refine(
    key => {
      try {
        validateTranslationKey(key)

        return true
      } catch {
        return false
      }
    },
    {message: 'Invalid translation key'},
  )
const storedOverrideSchema = z
  .object({
    key: keySchema,
    locale: localeSchema,
    value: z.string().trim().min(1).max(5_000),
  })
  .strict()
const replaceKeySchema = z
  .object({
    actorUserId: z.uuid(),
    key: keySchema,
    overrides: z
      .array(
        z
          .object({
            locale: localeSchema,
            value: z.string().trim().min(1).max(5_000),
          })
          .strict(),
      )
      .max(100)
      .refine(
        overrides =>
          new Set(overrides.map(override => override.locale)).size ===
          overrides.length,
        {message: 'Translation locales must be unique'},
      ),
  })
  .strict()

function createDatabaseTranslationRepository(
  database: TranslationDatabase,
): TranslationRepository {
  async function list(locale?: TranslationLocale) {
    const parsedLocale =
      locale === undefined ? undefined : localeSchema.parse(locale)
    const rows = await database.uiTranslationOverride.findMany({
      orderBy: [{key: 'asc'}, {locale: 'asc'}],
      select: {key: true, locale: true, value: true},
      where: parsedLocale ? {locale: parsedLocale} : undefined,
    })

    return Object.freeze(
      z
        .array(storedOverrideSchema)
        .parse(rows)
        .map(row => Object.freeze(row)) as readonly StoredTranslationOverride[],
    )
  }

  async function replaceKey(input: ReplaceTranslationKeyInput) {
    const parsed = replaceKeySchema.parse(input)

    await database.$transaction(async transaction => {
      await transaction.uiTranslationOverride.deleteMany({
        where: {key: parsed.key},
      })

      if (parsed.overrides.length > 0) {
        await transaction.uiTranslationOverride.createMany({
          data: parsed.overrides.map(override => ({
            key: parsed.key,
            locale: override.locale,
            updatedByUserId: parsed.actorUserId,
            value: override.value,
          })),
        })
      }

      await transaction.auditEvent.create({
        data: {
          action: 'translation.updated',
          actorUserId: parsed.actorUserId,
          entityId: null,
          entityType: 'UiTranslation',
          metadata: {
            key: parsed.key,
            locales: parsed.overrides.map(override => override.locale),
          },
        },
      })
    })
  }

  return Object.freeze({list, replaceKey})
}

export type {TranslationDatabase}

export {createDatabaseTranslationRepository}
