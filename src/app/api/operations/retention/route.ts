import {publicJson} from '@/server/email/public-api'
import {getConfiguredRetentionService} from '@/server/operations/configured-retention'
import {hasValidSchedulerAuthorization} from '@/server/operations/scheduler-auth'

export async function POST(request: Request) {
  if (!hasValidSchedulerAuthorization(request)) {
    return publicJson({error: 'Unauthorized', success: false}, 401, {
      'WWW-Authenticate': 'Bearer',
    })
  }

  try {
    const summary = await getConfiguredRetentionService().run()

    return publicJson({data: summary, success: true}, 200)
  } catch {
    console.error('Retention cleanup failed')

    return publicJson(
      {error: 'Unable to complete retention cleanup', success: false},
      500,
    )
  }
}

export const dynamic = 'force-dynamic'
