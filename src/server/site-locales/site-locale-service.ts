import {z} from 'zod'

const siteLocaleCodeInputSchema = z.string().trim().min(2).max(15)
const siteLocaleCodeSchema = z
  .string()
  .min(2)
  .max(15)
  .regex(/^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|\d{3}))?$/u)
const siteLocaleStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'DISABLED'])
const textDirectionSchema = z.enum(['LTR', 'RTL'])
const siteLocaleSchema = z
  .object({
    code: siteLocaleCodeSchema,
    direction: textDirectionSchema,
    englishName: z.string().trim().min(2).max(80),
    nativeName: z.string().trim().min(1).max(80),
    sortOrder: z.number().int().min(0).max(1_000),
    status: siteLocaleStatusSchema,
  })
  .strict()
const createSiteLocaleSchema = siteLocaleSchema
  .omit({status: true})
  .extend({actorUserId: z.uuid()})
  .strict()
const setSiteLocaleStatusSchema = z
  .object({
    actorUserId: z.uuid(),
    code: z.string(),
    status: siteLocaleStatusSchema,
  })
  .strict()

type SiteLocale = z.infer<typeof siteLocaleSchema>
type SiteLocaleStatus = z.infer<typeof siteLocaleStatusSchema>
type CreateSiteLocaleInput = z.input<typeof createSiteLocaleSchema>
type SiteLocaleRepository = Readonly<{
  create: (
    input: SiteLocale & Readonly<{actorUserId: string}>,
  ) => Promise<SiteLocale>
  find: (code: string) => Promise<SiteLocale | null>
  list: () => Promise<readonly SiteLocale[]>
  setStatus: (input: Readonly<{
    actorUserId: string
    code: string
    status: SiteLocaleStatus
  }>) => Promise<SiteLocale>
}>

function normalizeSiteLocaleCode(input: string) {
  const parsedInput = siteLocaleCodeInputSchema.safeParse(input)

  if (!parsedInput.success) throw new Error('SITE_LOCALE_CODE_INVALID')

  const raw = parsedInput.data
  const segments = raw.split('-')

  if (segments.length > 3) throw new Error('SITE_LOCALE_CODE_INVALID')

  const language = segments[0]?.toLowerCase() ?? ''
  const remainder = segments.slice(1).map(segment => {
    if (/^[a-z]{4}$/iu.test(segment)) {
      return `${segment[0]?.toUpperCase()}${segment.slice(1).toLowerCase()}`
    }

    if (/^(?:[a-z]{2}|\d{3})$/iu.test(segment)) {
      return segment.toUpperCase()
    }

    return segment
  })
  const normalized = [language, ...remainder].join('-')

  if (!siteLocaleCodeSchema.safeParse(normalized).success) {
    throw new Error('SITE_LOCALE_CODE_INVALID')
  }

  return normalized
}

function createSiteLocaleService(repository: SiteLocaleRepository) {
  async function create(input: CreateSiteLocaleInput) {
    const parsed = createSiteLocaleSchema.parse({
      ...input,
      code: normalizeSiteLocaleCode(input.code),
    })

    if (await repository.find(parsed.code)) {
      throw new Error('SITE_LOCALE_EXISTS')
    }

    return repository.create({
      ...parsed,
      status: 'DRAFT',
    })
  }

  async function list() {
    return Object.freeze(
      [...(await repository.list())]
        .map(locale => Object.freeze(siteLocaleSchema.parse(locale)))
        .sort(
          (left, right) =>
            left.sortOrder - right.sortOrder ||
            left.code.localeCompare(right.code),
        ),
    )
  }

  async function listActive() {
    return Object.freeze(
      (await list()).filter(locale => locale.status === 'ACTIVE'),
    )
  }

  async function setStatus(input: z.input<typeof setSiteLocaleStatusSchema>) {
    const parsed = setSiteLocaleStatusSchema.parse({
      ...input,
      code: normalizeSiteLocaleCode(input.code),
    })

    if (parsed.code === 'en' && parsed.status !== 'ACTIVE') {
      throw new Error('DEFAULT_SITE_LOCALE_REQUIRED')
    }

    if (!(await repository.find(parsed.code))) {
      throw new Error('SITE_LOCALE_NOT_FOUND')
    }

    return repository.setStatus(parsed)
  }

  return Object.freeze({create, list, listActive, setStatus})
}

export type {
  CreateSiteLocaleInput,
  SiteLocale,
  SiteLocaleRepository,
  SiteLocaleStatus,
}

export {
  createSiteLocaleService,
  normalizeSiteLocaleCode,
  siteLocaleCodeSchema,
}
