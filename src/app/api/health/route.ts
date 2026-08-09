const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
}

export function GET() {
  return Response.json(
    {status: 'ok'},
    {headers: NO_STORE_HEADERS, status: 200},
  )
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
