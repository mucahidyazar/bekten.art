import {Resend} from 'resend'

import {createResendMailer, getResendConfiguration} from './resend-mailer'

let configuredMailer:
  | ReturnType<typeof createResendMailer>
  | undefined

export function getConfiguredMailer(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  if (environment === process.env && configuredMailer) {
    return configuredMailer
  }

  const configuration = getResendConfiguration(environment)
  const mailer = createResendMailer(
    new Resend(configuration.apiKey),
    configuration,
  )

  if (environment === process.env) {
    configuredMailer = mailer
  }

  return mailer
}
