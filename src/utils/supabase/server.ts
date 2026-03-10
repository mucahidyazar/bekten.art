import {unstable_noStore as noStore} from 'next/cache'

import {auth} from '@/auth'
import {prisma} from '@/lib/db'

type QueryError = {
  code?: string
  message: string
}

type QueryResult<T> = {
  data: T
  error: QueryError | null
}

type SocialRecord = {
  id: string
  user_id: string
  platform: string
  url: string
  created_at: string
  updated_at: string
}

export type EnhancedUser = {
  id: string
  aud: string
  role?: string
  email?: string
  email_confirmed_at?: string
  phone?: string
  confirmed_at?: string
  last_sign_in_at?: string
  app_metadata: Record<string, unknown>
  user_metadata: Record<string, unknown>
  identities?: Array<Record<string, unknown>>
  created_at: string
  updated_at?: string
  is_anonymous?: boolean
  profile: {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role?: string | null
    phone?: string | null
    address?: string | null
    bio?: string | null
    website?: string | null
    twitter?: string | null
    instagram?: string | null
    linkedin?: string | null
    github?: string | null
    working_hours?: string | null
    map_embed_url?: string | null
    created_at?: string
    updated_at?: string
    avatar_url?: string | null
    socials?: SocialRecord[]
  }
  isAdmin: boolean
}

export interface GetUserOptions {
  includeSocials?: boolean
}

type Filter =
  | {kind: 'eq'; field: string; value: unknown}
  | {kind: 'in'; field: string; values: unknown[]}
  | {kind: 'like'; field: string; value: string}

type TableName =
  | 'users'
  | 'socials'
  | 'sections'
  | 'section_data'
  | 'uploaded_files'

const TABLE_DELEGATES = {
  section_data: prisma.sectionData,
  sections: prisma.section,
  socials: prisma.social,
  uploaded_files: prisma.uploadedFile,
  users: prisma.user,
} as const

const DATE_FIELDS = new Set([
  'confirmed_at',
  'created_at',
  'email_confirmed_at',
  'expires',
  'last_sign_in_at',
  'updated_at',
  'uploaded_at',
])

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        serializeValue(nestedValue),
      ]),
    )
  }

  return value
}

function coerceValue(field: string, value: unknown): unknown {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (DATE_FIELDS.has(field) && typeof value === 'string') {
    return new Date(value)
  }

  return value
}

function buildWhere(filters: Filter[]) {
  return filters.reduce<Record<string, unknown>>((where, filter) => {
    if (filter.kind === 'eq') {
      where[filter.field] = filter.value

      return where
    }

    if (filter.kind === 'in') {
      where[filter.field] = {in: filter.values}

      return where
    }

    const pattern = filter.value

    if (pattern.endsWith('%') && !pattern.includes('_')) {
      where[filter.field] = {startsWith: pattern.slice(0, -1)}

      return where
    }

    where[filter.field] = {contains: pattern.replaceAll('%', '')}

    return where
  }, {})
}

async function executeTableQuery({
  expectSingle,
  filters,
  operation,
  orderBy,
  payload,
  returnRows,
  table,
  take,
}: {
  expectSingle: boolean
  filters: Filter[]
  operation: 'delete' | 'insert' | 'select' | 'update' | 'upsert'
  orderBy?: {ascending: boolean; field: string}
  payload?: unknown
  returnRows: boolean
  table: TableName
  take?: number
}): Promise<QueryResult<any>> {
  const delegate = TABLE_DELEGATES[table] as any
  const where = buildWhere(filters)
  const order =
    orderBy === undefined
      ? undefined
      : {
          [orderBy.field]: orderBy.ascending ? 'asc' : 'desc',
        }

  try {
    if (operation === 'select') {
      const rows = await delegate.findMany({
        orderBy: order,
        take,
        where,
      })

      const serializedRows = rows.map((row: any) => serializeValue(row))

      if (expectSingle) {
        if (serializedRows.length === 0) {
          return {
            data: null,
            error: {
              code: 'PGRST116',
              message: 'No rows found',
            },
          }
        }

        return {
          data: serializedRows[0],
          error: null,
        }
      }

      return {
        data: serializedRows,
        error: null,
      }
    }

    if (operation === 'insert') {
      const rows = (Array.isArray(payload) ? payload : [payload]).filter(Boolean)
      const createdRows = []

      for (const row of rows) {
        const created = await delegate.create({
          data: Object.fromEntries(
            Object.entries((row as Record<string, unknown>) || {}).map(
              ([field, value]) => [field, coerceValue(field, value)],
            ),
          ),
        })

        createdRows.push(serializeValue(created))
      }

      if (!returnRows) {
        return {data: null, error: null}
      }

      if (expectSingle) {
        return {
          data: createdRows[0] ?? null,
          error:
            createdRows.length === 0
              ? {code: 'PGRST116', message: 'No rows created'}
              : null,
        }
      }

      return {data: createdRows, error: null}
    }

    if (operation === 'update') {
      const rows = await delegate.findMany({
        orderBy: order,
        take,
        where,
      })

      if (rows.length === 0) {
        return expectSingle
          ? {data: null, error: {code: 'PGRST116', message: 'No rows found'}}
          : {data: [], error: null}
      }

      const updatedRows = []

      for (const row of rows) {
        const updated = await delegate.update({
          where: {id: (row as {id: string}).id},
          data: Object.fromEntries(
            Object.entries((payload as Record<string, unknown>) || {}).map(
              ([field, value]) => [field, coerceValue(field, value)],
            ),
          ),
        })

        updatedRows.push(serializeValue(updated))
      }

      if (!returnRows) {
        return {data: null, error: null}
      }

      return expectSingle
        ? {data: updatedRows[0], error: null}
        : {data: updatedRows, error: null}
    }

    if (operation === 'delete') {
      const rows = await delegate.findMany({
        orderBy: order,
        take,
        where,
      })

      if (rows.length === 0) {
        return expectSingle
          ? {data: null, error: {code: 'PGRST116', message: 'No rows found'}}
          : {data: [], error: null}
      }

      await delegate.deleteMany({where})

      const deletedRows = rows.map((row: any) => serializeValue(row))

      if (!returnRows) {
        return {data: null, error: null}
      }

      return expectSingle
        ? {data: deletedRows[0], error: null}
        : {data: deletedRows, error: null}
    }

    const upsertPayload = payload as {
      data: Record<string, unknown>
      onConflict?: string
    }
    const uniqueField = upsertPayload.onConflict || 'id'
    const uniqueValue = upsertPayload.data[uniqueField]

    if (!uniqueValue) {
      return {
        data: null,
        error: {
          message: `Missing unique value for ${uniqueField}`,
        },
      }
    }

    const result = await (delegate as any).upsert({
      where: {[uniqueField]: uniqueValue},
      create: Object.fromEntries(
        Object.entries(upsertPayload.data).map(([field, value]) => [
          field,
          coerceValue(field, value),
        ]),
      ),
      update: Object.fromEntries(
        Object.entries(upsertPayload.data).map(([field, value]) => [
          field,
          coerceValue(field, value),
        ]),
      ),
    })

    if (!returnRows) {
      return {data: null, error: null}
    }

    return {
      data: serializeValue(result),
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown database error',
      },
    }
  }
}

class QueryBuilder implements PromiseLike<QueryResult<any>> {
  private expectSingle = false
  private filters: Filter[] = []
  private operation: 'delete' | 'insert' | 'select' | 'update' | 'upsert' =
    'select'
  private orderBy?: {ascending: boolean; field: string}
  private payload?: unknown
  private returnRows = false
  private take?: number

  constructor(private readonly table: TableName) {}

  delete() {
    this.operation = 'delete'

    return this
  }

  eq(field: string, value: unknown) {
    this.filters.push({kind: 'eq', field, value})

    return this
  }

  in(field: string, values: unknown[]) {
    this.filters.push({kind: 'in', field, values})

    return this
  }

  insert(data: unknown) {
    this.operation = 'insert'
    this.payload = data

    return this
  }

  like(field: string, value: string) {
    this.filters.push({kind: 'like', field, value})

    return this
  }

  limit(value: number) {
    this.take = value

    return this
  }

  order(field: string, options?: {ascending?: boolean}) {
    this.orderBy = {
      field,
      ascending: options?.ascending ?? true,
    }

    return this
  }

  select(_fields?: string) {
    if (this.operation === 'select') {
      return this
    }

    this.returnRows = true

    return this
  }

  single() {
    this.expectSingle = true
    this.take = 1

    return this
  }

  then<TResult1 = QueryResult<any>, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult<any>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
  ): PromiseLike<TResult1 | TResult2> {
    return executeTableQuery({
      expectSingle: this.expectSingle,
      filters: this.filters,
      operation: this.operation,
      orderBy: this.orderBy,
      payload: this.payload,
      returnRows: this.returnRows,
      table: this.table,
      take: this.take,
    }).then(onfulfilled, onrejected)
  }

  update(data: unknown) {
    this.operation = 'update'
    this.payload = data

    return this
  }

  upsert(data: Record<string, unknown>, options?: {onConflict?: string}) {
    this.operation = 'upsert'
    this.payload = {
      data,
      onConflict: options?.onConflict,
    }
    this.returnRows = true

    return this
  }
}

function toEnhancedUser(
  user: Awaited<ReturnType<typeof prisma.user.findUnique>>,
  socials: SocialRecord[],
): EnhancedUser | null {
  if (!user?.email) {
    return null
  }

  return {
    id: user.id,
    aud: 'authenticated',
    role: user.role,
    email: user.email,
    email_confirmed_at: user.emailVerified?.toISOString(),
    confirmed_at: user.emailVerified?.toISOString(),
    last_sign_in_at: user.last_sign_in_at?.toISOString(),
    app_metadata: {},
    user_metadata: {
      avatar_url: user.image,
      full_name: user.name,
      name: user.name,
    },
    identities: [],
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at?.toISOString(),
    is_anonymous: false,
    profile: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      phone: user.phone,
      address: user.address,
      bio: user.bio,
      website: user.website,
      twitter: user.twitter,
      instagram: user.instagram,
      linkedin: user.linkedin,
      github: user.github,
      working_hours: user.working_hours,
      map_embed_url: user.map_embed_url,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at?.toISOString(),
      avatar_url: user.image,
      socials,
    },
    isAdmin: user.role === 'ADMIN',
  }
}

export async function createClient() {
  return {
    from(table: TableName) {
      return new QueryBuilder(table)
    },
  }
}

export async function getBektenContactInfo() {
  noStore()

  const profile = await prisma.user.findFirst({
    include: {
      socials: {
        orderBy: {platform: 'asc'},
      },
    },
    where: {
      email: 'bekten.usubaliev@gmail.com',
      role: 'ADMIN',
    },
  })

  if (!profile) {
    return null
  }

  return {
    address: profile.address,
    map_embed_url: profile.map_embed_url,
    name: profile.name,
    phone: profile.phone,
    socials: profile.socials.map(social => serializeValue(social)) as SocialRecord[],
    working_hours: profile.working_hours,
  }
}

export async function getUser(
  options: GetUserOptions = {},
): Promise<EnhancedUser | null> {
  noStore()

  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    include: {
      socials: options.includeSocials
        ? {
            orderBy: {platform: 'asc'},
          }
        : false,
    },
    where: {
      id: session.user.id,
    },
  })

  return toEnhancedUser(
    user,
    (user?.socials.map(social => serializeValue(social)) as SocialRecord[]) || [],
  )
}

export async function requireAdmin() {
  const user = await getUser()

  if (!user || user.profile?.role?.toLowerCase() !== 'admin') {
    throw new Error('Admin access required')
  }

  return user
}

export async function requireAuth(options: GetUserOptions = {}) {
  const user = await getUser(options)

  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}
