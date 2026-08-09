import {Resend} from 'resend'

import {prisma} from '@/lib/db'

import {createDatabaseResendWebhookStore} from './database-resend-webhook'
import {createResendWebhookService} from './resend-webhook'

let configured: ReturnType<typeof createResendWebhookService> | undefined

function required(name: 'RESEND_API_KEY' | 'RESEND_WEBHOOK_SECRET') {
  const value = process.env[name]?.trim()

  if (!value) throw new Error('RESEND_WEBHOOK_CONFIGURATION_INVALID')

  return value
}

export function getConfiguredResendWebhookService() {
  if (configured) return configured

  const resend = new Resend(required('RESEND_API_KEY'))
  const webhookSecret = required('RESEND_WEBHOOK_SECRET')

  configured = createResendWebhookService(
    {
      verify(input) {
        return resend.webhooks.verify({...input, webhookSecret})
      },
    },
    createDatabaseResendWebhookStore(prisma),
  )

  return configured
}
