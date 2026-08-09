import {checkReadiness} from '../../../server/operations/health/readiness'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
}
const FAILED_READINESS = {
  checks: {
    configuration: 'error',
    database: 'error',
    email: 'error',
    objectStorage: 'error',
  },
  status: 'not_ready',
} as const

export async function GET() {
  try {
    const readiness = await checkReadiness()

    return Response.json(readiness, {
      headers: NO_STORE_HEADERS,
      status: readiness.status === 'ready' ? 200 : 503,
    })
  } catch {
    return Response.json(FAILED_READINESS, {
      headers: NO_STORE_HEADERS,
      status: 503,
    })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
