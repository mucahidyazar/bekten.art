import {pathToFileURL} from 'node:url'

import {PrismaPg} from '@prisma/adapter-pg'
import {PrismaClient} from '@prisma/client'
import {z} from 'zod'

const dashboardEditorEmailSchema = z.email().max(254)

function environmentValue(environment, name) {
  const value = environment[name]

  return typeof value === 'string' ? value.trim() : ''
}

export function assertDashboardEditorUpsertAllowed(environment) {
  const email = normalizeDashboardEditorEmail(
    environmentValue(environment, 'DASHBOARD_EDITOR_EMAIL'),
  )
  const expectedConfirmation = `grant-editor:${email}`

  if (
    environmentValue(environment, 'ALLOW_DASHBOARD_EDITOR_UPSERT') !==
      'true' ||
    environmentValue(
      environment,
      'DASHBOARD_EDITOR_UPSERT_CONFIRMATION',
    ) !== expectedConfirmation
  ) {
    throw new Error('DASHBOARD_EDITOR_UPSERT_NOT_AUTHORIZED')
  }

  return email
}

export function createDashboardEditorDatabase(environment) {
  const connectionString = environmentValue(environment, 'DATABASE_URL')

  if (!/^postgres(?:ql)?:\/\//u.test(connectionString)) {
    throw new Error('DASHBOARD_EDITOR_DATABASE_CONFIGURATION_INVALID')
  }

  return new PrismaClient({
    adapter: new PrismaPg({connectionString}),
  })
}

export function dashboardEditorUpsertErrorMessage(error) {
  return error instanceof Error &&
    /^DASHBOARD_EDITOR_[A-Z0-9_]+$/u.test(error.message)
    ? error.message
    : 'DASHBOARD_EDITOR_UPSERT_FAILED'
}

export function normalizeDashboardEditorEmail(candidate) {
  const normalized =
    typeof candidate === 'string'
      ? candidate.normalize('NFKC').trim().toLowerCase()
      : ''
  const parsed = dashboardEditorEmailSchema.safeParse(normalized)

  if (!parsed.success || /[\r\n,]/u.test(normalized)) {
    throw new Error('DASHBOARD_EDITOR_EMAIL_INVALID')
  }

  return parsed.data
}

export async function upsertDashboardEditor(database, candidate) {
  const email = normalizeDashboardEditorEmail(candidate)
  const user = await database.$transaction(async transaction => {
    await transaction.user.updateMany({
      data: {role: 'EDITOR'},
      where: {email, role: {notIn: ['OWNER', 'ADMIN']}},
    })

    return transaction.user.upsert({
      create: {email, role: 'EDITOR'},
      select: {email: true, role: true},
      update: {},
      where: {email},
    })
  })

  return Object.freeze({email: user.email, role: user.role})
}

async function main(environment) {
  const email = assertDashboardEditorUpsertAllowed(environment)
  const database = createDashboardEditorDatabase(environment)

  try {
    const editor = await upsertDashboardEditor(database, email)

    process.stdout.write(`Dashboard editor ready: ${editor.email}\n`)
  } finally {
    await database.$disconnect()
  }
}

const entryPoint = process.argv[1]

if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  main(process.env).catch(error => {
    process.stderr.write(`${dashboardEditorUpsertErrorMessage(error)}\n`)
    process.exitCode = 1
  })
}
