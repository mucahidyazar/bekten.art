type AppLocale = 'en' | 'tr' | 'ru' | 'ky'
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u

type ResendResult = Readonly<{
  data: Readonly<{id: string}> | null
  error: Readonly<{message: string; name?: string}> | null
}>

type ResendLike = Readonly<{
  emails: Readonly<{
    send: (
      payload: Readonly<{
        from: string
        headers?: Readonly<Record<string, string>>
        html: string
        replyTo?: string
        subject: string
        text: string
        to: string[]
      }>,
      options: Readonly<{idempotencyKey: string}>,
    ) => Promise<ResendResult>
  }>
}>

export function createResendMailer(
  resend: ResendLike,
  configuration: Readonly<{
    apiKey: string
    from: string
    replyTo: string | null
  }>,
) {
  async function deliver(
    content: Readonly<{html: string; subject: string; text: string}>,
    input: Readonly<{
      idempotencyKey: string
      headers?: Readonly<Record<string, string>>
      replyTo?: string
      to: string
    }>,
  ) {
    let result: ResendResult
    const replyTo = input.replyTo ?? configuration.replyTo

    if (
      !emailPattern.test(input.to) ||
      (replyTo && !emailPattern.test(replyTo))
    ) {
      throw new Error('EMAIL_DELIVERY_FAILED')
    }

    try {
      result = await resend.emails.send(
        {
          from: configuration.from,
          ...(input.headers ? {headers: input.headers} : {}),
          html: content.html,
          ...(replyTo ? {replyTo} : {}),
          subject: content.subject,
          text: content.text,
          to: [input.to],
        },
        {idempotencyKey: input.idempotencyKey},
      )
    } catch {
      throw new Error('EMAIL_DELIVERY_FAILED')
    }

    if (!result.data?.id || result.error) {
      throw new Error('EMAIL_DELIVERY_FAILED')
    }

    return {id: result.data.id}
  }

  return {
    async sendFeedbackAcknowledgement(
      input: Readonly<{
        idempotencyKey: string
        name: string
        to: string
      }>,
    ) {
      return deliver(feedbackAcknowledgementContent(input), input)
    },
    async sendFeedbackNotification(
      input: Readonly<{
        idempotencyKey: string
        message: string
        name: string
        replyTo: string
        subject: string
      }>,
    ) {
      if (!configuration.replyTo) {
        throw new Error('EMAIL_DELIVERY_FAILED')
      }

      return deliver(feedbackNotificationContent(input), {
        idempotencyKey: input.idempotencyKey,
        replyTo: input.replyTo,
        to: configuration.replyTo,
      })
    },
    async sendNewsletterConfirmation(
      input: Readonly<{
        confirmationUrl: string
        idempotencyKey: string
        locale: AppLocale
        to: string
      }>,
    ) {
      return deliver(newsletterConfirmationContent(input), input)
    },
    async sendNewsletterWelcome(
      input: Readonly<{
        idempotencyKey: string
        locale: AppLocale
        to: string
        unsubscribeUrl: string
      }>,
    ) {
      return deliver(newsletterWelcomeContent(input), {
        ...input,
        headers: {
          'List-Unsubscribe': `<${input.unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
    },
    async sendStudioMagicLink(
      input: Readonly<{
        expiresAt: Date
        idempotencyKey: string
        signInUrl: string
        to: string
      }>,
    ) {
      return deliver(studioMagicLinkContent(input), input)
    },
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function greeting(name: string | null, locale: AppLocale) {
  if (!name) {
    if (locale === 'tr') return 'Merhaba,'
    if (locale === 'ru') return 'Здравствуйте!'
    if (locale === 'ky') return 'Саламатсызбы!'

    return 'Hello,'
  }

  if (locale === 'tr') return `Merhaba ${name},`
  if (locale === 'ru') return `Здравствуйте, ${name}!`
  if (locale === 'ky') return `Саламатсызбы, ${name}!`

  return `Hello ${name},`
}

function emailCard(
  input: Readonly<{
    action?: Readonly<{label: string; url: string}>
    body: string
    locale: AppLocale | 'en'
    title: string
  }>,
) {
  const safeActionUrl = input.action ? escapeHtml(input.action.url) : null

  return `<!doctype html>
<html lang="${input.locale}">
  <body style="margin:0;background:#f7f5ff;color:#17142b;font-family:Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px">
      <div style="border:1px solid #e4defa;border-radius:24px;background:#fff;padding:32px">
        <h1 style="margin:0 0 18px;font-size:22px">${escapeHtml(input.title)}</h1>
        <div style="font-size:15px;line-height:1.7;color:#5f5975">${input.body}</div>
        ${input.action && safeActionUrl ? `<a href="${safeActionUrl}" style="display:inline-block;margin-top:24px;border-radius:12px;background:#6f4cff;color:#fff;padding:13px 20px;text-decoration:none;font-weight:700">${escapeHtml(input.action.label)}</a>` : ''}
      </div>
    </div>
  </body>
</html>`
}

function feedbackNotificationContent(
  input: Readonly<{
    message: string
    name: string
    subject: string
  }>,
) {
  const safeName = escapeHtml(input.name)
  const safeSubject = escapeHtml(input.subject)
  const safeMessage = escapeHtml(input.message).replaceAll('\n', '<br>')

  return {
    html: emailCard({
      body: `<p><strong>From:</strong> ${safeName}</p><p><strong>Subject:</strong> ${safeSubject}</p><p>${safeMessage}</p>`,
      locale: 'en',
      title: 'New website contact request',
    }),
    subject: 'New Bekten Art website contact request',
    text: `From: ${input.name}\nSubject: ${input.subject}\n\n${input.message}`,
  }
}

function feedbackAcknowledgementContent(input: Readonly<{name: string}>) {
  const salutation = escapeHtml(greeting(input.name, 'en'))
  const message =
    'Thank you for contacting Bekten Art. Your message has been received and our team will reply as soon as possible.'

  return {
    html: emailCard({
      body: `<p>${salutation}</p><p>${escapeHtml(message)}</p>`,
      locale: 'en',
      title: 'We received your message',
    }),
    subject: 'We received your Bekten Art message',
    text: `${greeting(input.name, 'en')}\n\n${message}`,
  }
}

function newsletterCopy(locale: AppLocale) {
  if (locale === 'tr') {
    return {
      confirmAction: 'Aboneliğimi doğrula',
      confirmBody:
        'Bekten Art haberlerine kaydınızı tamamlamak için e-posta adresinizi doğrulayın.',
      confirmSubject: 'Bekten Art bülten aboneliğinizi doğrulayın',
      unsubscribe: 'Abonelikten çık',
      welcomeBody:
        'Aboneliğiniz doğrulandı. Yeni eser, sergi ve atölye haberlerini sizinle paylaşacağız.',
      welcomeSubject: 'Bekten Art bültenine hoş geldiniz',
    }
  }

  if (locale === 'ru') {
    return {
      confirmAction: 'Подтвердить подписку',
      confirmBody:
        'Подтвердите адрес электронной почты, чтобы завершить подписку на новости Bekten Art.',
      confirmSubject: 'Подтвердите подписку на новости Bekten Art',
      unsubscribe: 'Отписаться',
      welcomeBody:
        'Подписка подтверждена. Мы будем присылать новости о работах, выставках и мастер-классах.',
      welcomeSubject: 'Добро пожаловать в рассылку Bekten Art',
    }
  }

  if (locale === 'ky') {
    return {
      confirmAction: 'Жазылууну ырастоо',
      confirmBody:
        'Bekten Art жаңылыктарына жазылууну бүтүрүү үчүн электрондук почтаңызды ырастаңыз.',
      confirmSubject: 'Bekten Art жаңылыктарына жазылууну ырастаңыз',
      unsubscribe: 'Жазылуудан чыгуу',
      welcomeBody:
        'Жазылууңуз ырасталды. Жаңы эмгектер, көргөзмөлөр жана устаканалар тууралуу кабарлайбыз.',
      welcomeSubject: 'Bekten Art жаңылыктарына кош келиңиз',
    }
  }

  return {
    confirmAction: 'Confirm my subscription',
    confirmBody:
      'Confirm your email address to complete your Bekten Art newsletter subscription.',
    confirmSubject: 'Confirm your Bekten Art newsletter subscription',
    unsubscribe: 'Unsubscribe',
    welcomeBody:
      'Your subscription is confirmed. We will share news about new art, exhibitions and workshops.',
    welcomeSubject: 'Welcome to the Bekten Art newsletter',
  }
}

function newsletterConfirmationContent(
  input: Readonly<{
    confirmationUrl: string
    locale: AppLocale
  }>,
) {
  const copy = newsletterCopy(input.locale)

  return {
    html: emailCard({
      action: {label: copy.confirmAction, url: input.confirmationUrl},
      body: `<p>${escapeHtml(copy.confirmBody)}</p>`,
      locale: input.locale,
      title: copy.confirmSubject,
    }),
    subject: copy.confirmSubject,
    text: `${copy.confirmBody}\n\n${copy.confirmAction}: ${input.confirmationUrl}`,
  }
}

function newsletterWelcomeContent(
  input: Readonly<{
    locale: AppLocale
    unsubscribeUrl: string
  }>,
) {
  const copy = newsletterCopy(input.locale)

  return {
    html: emailCard({
      action: {label: copy.unsubscribe, url: input.unsubscribeUrl},
      body: `<p>${escapeHtml(copy.welcomeBody)}</p>`,
      locale: input.locale,
      title: copy.welcomeSubject,
    }),
    subject: copy.welcomeSubject,
    text: `${copy.welcomeBody}\n\n${copy.unsubscribe}: ${input.unsubscribeUrl}`,
  }
}

function studioMagicLinkContent(
  input: Readonly<{expiresAt: Date; signInUrl: string}>,
) {
  const expiration = input.expiresAt.toISOString()
  const body =
    'Use this private, one-time link to enter Bekten Studio. The link expires in 10 minutes. If you did not request it, you can ignore this email.'

  return {
    html: emailCard({
      action: {label: 'Open Bekten Studio', url: input.signInUrl},
      body: `<p>${escapeHtml(body)}</p><p><small>Expires: ${escapeHtml(expiration)}</small></p>`,
      locale: 'en',
      title: 'Bekten Studio sign-in',
    }),
    subject: 'Bekten Studio sign-in link',
    text: `${body}\n\nOpen Bekten Studio: ${input.signInUrl}\nExpires: ${expiration}`,
  }
}

export function getResendConfiguration(
  environment: Readonly<Record<string, string | undefined>>,
) {
  const apiKey = environment.RESEND_API_KEY?.trim() || ''
  const fromEmail = environment.RESEND_FROM_EMAIL?.trim().toLowerCase() || ''
  const replyTo = environment.RESEND_REPLY_TO?.trim().toLowerCase() || ''

  if (
    !/^re_[A-Za-z0-9_-]+$/u.test(apiKey) ||
    !emailPattern.test(fromEmail) ||
    (replyTo && !emailPattern.test(replyTo))
  ) {
    throw new Error('EMAIL_CONFIGURATION_INVALID')
  }

  return {
    apiKey,
    from: `Bekten Art <${fromEmail}>`,
    replyTo: replyTo || null,
  }
}
