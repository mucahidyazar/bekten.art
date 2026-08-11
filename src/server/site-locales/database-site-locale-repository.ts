import {z} from 'zod'

import {siteLocaleCodeSchema} from './site-locale-service'

import type {
  SiteLocale,
  SiteLocaleRepository,
} from './site-locale-service'

type SiteLocaleTransaction = Readonly<{
  auditEvent: Readonly<{create: (input: unknown) => Promise<unknown>}>
  siteLocale: Readonly<{
    create: (input: unknown) => Promise<unknown>
    update: (input: unknown) => Promise<unknown>
  }>
}>

type SiteLocaleDatabase = Readonly<{
  $transaction: <Result>(
    callback: (transaction: SiteLocaleTransaction) => Promise<Result>,
  ) => Promise<Result>
  siteLocale: Readonly<{
    findMany: (input: unknown) => Promise<unknown>
    findUnique: (input: unknown) => Promise<unknown>
  }>
}>

const siteLocaleRowSchema = z
  .object({
    code: siteLocaleCodeSchema,
    direction: z.enum(['LTR', 'RTL']),
    englishName: z.string().trim().min(2).max(80),
    nativeName: z.string().trim().min(1).max(80),
    sortOrder: z.number().int().min(0).max(1_000),
    status: z.enum(['DRAFT', 'ACTIVE', 'DISABLED']),
  })
  .strict()

const localeSelect = Object.freeze({
  code: true,
  direction: true,
  englishName: true,
  nativeName: true,
  sortOrder: true,
  status: true,
})

function parseRow(value: unknown) {
  return Object.freeze(siteLocaleRowSchema.parse(value))
}

function createDatabaseSiteLocaleRepository(
  database: SiteLocaleDatabase,
): SiteLocaleRepository {
  async function create(
    input: SiteLocale & Readonly<{actorUserId: string}>,
  ) {
    const parsed = siteLocaleRowSchema.parse({
      code: input.code,
      direction: input.direction,
      englishName: input.englishName,
      nativeName: input.nativeName,
      sortOrder: input.sortOrder,
      status: input.status,
    })

    return database.$transaction(async transaction => {
      const created = parseRow(
        await transaction.siteLocale.create({
          data: {
            code: parsed.code,
            createdById: input.actorUserId,
            direction: parsed.direction,
            englishName: parsed.englishName,
            isDefault: false,
            nativeName: parsed.nativeName,
            sortOrder: parsed.sortOrder,
            status: 'DRAFT',
            updatedById: input.actorUserId,
          },
          select: localeSelect,
        }),
      )

      await transaction.auditEvent.create({
        data: {
          action: 'site-locale.created',
          actorUserId: input.actorUserId,
          entityId: parsed.code,
          entityType: 'SiteLocale',
          metadata: {direction: parsed.direction, status: 'DRAFT'},
        },
      })

      return created
    })
  }

  async function find(code: string) {
    const row = await database.siteLocale.findUnique({
      select: localeSelect,
      where: {code: siteLocaleCodeSchema.parse(code)},
    })

    return row === null ? null : parseRow(row)
  }

  async function list() {
    const rows = z.array(siteLocaleRowSchema).parse(
      await database.siteLocale.findMany({
        orderBy: [{sortOrder: 'asc'}, {code: 'asc'}],
        select: localeSelect,
      }),
    )

    return Object.freeze(rows.map(row => Object.freeze(row)))
  }

  async function setStatus(
    input: Parameters<SiteLocaleRepository['setStatus']>[0],
  ) {
    return database.$transaction(async transaction => {
      const updated = parseRow(
        await transaction.siteLocale.update({
          data: {status: input.status, updatedById: input.actorUserId},
          select: localeSelect,
          where: {code: siteLocaleCodeSchema.parse(input.code)},
        }),
      )

      await transaction.auditEvent.create({
        data: {
          action: 'site-locale.status-updated',
          actorUserId: input.actorUserId,
          entityId: updated.code,
          entityType: 'SiteLocale',
          metadata: {status: updated.status},
        },
      })

      return updated
    })
  }

  return Object.freeze({create, find, list, setStatus})
}

export type {SiteLocaleDatabase}

export {createDatabaseSiteLocaleRepository}
