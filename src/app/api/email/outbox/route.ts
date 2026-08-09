import {getConfiguredOutboxDispatcher} from '@/server/email/configured-outbox-dispatcher'
import {publicJson} from '@/server/email/public-api'
import {hasValidSchedulerAuthorization} from '@/server/operations/scheduler-auth'

export async function POST(request: Request) {
  if (!hasValidSchedulerAuthorization(request)) {
    return publicJson({error: 'Unauthorized', success: false}, 401, {
      'WWW-Authenticate': 'Bearer',
    })
  }

  try {
    const summary = await getConfiguredOutboxDispatcher().dispatchBatch(10)

    return publicJson({data: summary, success: true}, 200)
  } catch {
    console.error('Outbox dispatch failed')

    return publicJson(
      {error: 'Unable to dispatch email jobs', success: false},
      500,
    )
  }
}

export const dynamic = 'force-dynamic'
