'use client'

import {type FormEvent, useEffect, useId, useRef, useState} from 'react'

import {cn} from '@/utils/cn'

import {inquiryHeading, publicInquiryCopy} from './public-inquiry-copy'
import {
  buildPublicInquiryPayload,
  fingerprintPublicInquiryPayload,
} from './public-inquiry-payload'
import {responseRetryDelay} from './public-inquiry-retry'
import {validatePublicInquiryForm} from './public-inquiry-validation'

import type {PublicInquiryFormProps} from './public-inquiry-types'
import type {PublicInquiryFieldErrors} from './public-inquiry-validation'

export function PublicInquiryForm(props: PublicInquiryFormProps) {
  const copy = publicInquiryCopy[props.locale]
  const heading = inquiryHeading(copy, props.type)
  const generatedId = useId().replaceAll(':', '')
  const formId = `public-inquiry-${generatedId}`
  const submissionIdRef = useRef<string | null>(null)
  const submissionFingerprintRef = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] =
    useState<PublicInquiryFieldErrors>(EMPTY_FIELD_ERRORS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(
    null,
  )
  const artwork = 'artwork' in props ? props.artwork : undefined
  const privacyPolicyHref =
    props.privacyPolicyHref ?? `/${props.locale}/privacy-policy`
  const validationMessages = {
    invalid: copy.validationInvalid,
    required: copy.validationRequired,
  }

  useEffect(() => {
    if (retryAfterSeconds === null) return

    const timeout = globalThis.setTimeout(() => {
      setError(null)
      setRetryAfterSeconds(null)
    }, retryAfterSeconds * 1_000)

    return () => globalThis.clearTimeout(timeout)
  }, [retryAfterSeconds])

  function handleInput(event: FormEvent<HTMLFormElement>) {
    if (Object.keys(fieldErrors).length === 0) return

    setFieldErrors(
      validatePublicInquiryForm(event.currentTarget, validationMessages).errors,
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (retryAfterSeconds !== null) return

    setError(null)

    const formElement = event.currentTarget
    const validation = validatePublicInquiryForm(
      formElement,
      validationMessages,
    )

    setFieldErrors(validation.errors)

    if (validation.firstInvalid) {
      validation.firstInvalid.focus()

      return
    }

    setIsSubmitting(true)

    const form = new FormData(formElement)

    try {
      const draftPayload = buildPublicInquiryPayload(
        form,
        props,
        FINGERPRINT_SUBMISSION_ID,
      )
      const fingerprint = fingerprintPublicInquiryPayload(draftPayload)
      const isUnchangedRetry =
        submissionIdRef.current !== null &&
        submissionFingerprintRef.current === fingerprint
      const submissionId = isUnchangedRetry
        ? submissionIdRef.current
        : globalThis.crypto.randomUUID()
      const payload = Object.freeze({...draftPayload, submissionId})

      submissionIdRef.current = submissionId
      submissionFingerprintRef.current = fingerprint

      const response = await fetch('/api/inquiries', {
        body: JSON.stringify(payload),
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      })
      const retryDelay = responseRetryDelay(response)

      if (retryDelay !== null) {
        setError(copy.rateLimited.replace('{seconds}', String(retryDelay)))
        setRetryAfterSeconds(retryDelay)

        return
      }

      if (!response.ok) throw new Error('INQUIRY_SUBMISSION_FAILED')

      formElement.reset()
      submissionIdRef.current = null
      submissionFingerprintRef.current = null
      setIsSuccess(true)
    } catch {
      setError(copy.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      aria-labelledby={`${formId}-title`}
      className={cn(
        'border-y border-stone-400 bg-[#f4efe3] px-5 py-8 text-stone-950 sm:px-8 sm:py-10',
        props.className,
      )}
    >
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-red-900 uppercase">
          Bekten Studio
        </p>
        <h2
          className="mt-3 font-serif text-3xl leading-tight tracking-tight sm:text-4xl"
          id={`${formId}-title`}
        >
          {heading.title}
        </h2>
        <p
          className="mt-3 max-w-xl text-base leading-7 text-stone-700"
          id={`${formId}-description`}
        >
          {heading.description}
        </p>
      </header>

      {artwork ? (
        <aside
          aria-label={artwork.title}
          className="mt-7 border-l-2 border-red-900 pl-4"
        >
          <p className="font-serif text-xl">{artwork.title}</p>
          {artwork.year || artwork.medium ? (
            <p className="mt-1 text-sm text-stone-600">
              {[artwork.year, artwork.medium].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </aside>
      ) : null}

      {isSuccess ? (
        <p
          aria-live="polite"
          className="mt-8 max-w-2xl border border-stone-500 bg-stone-50/70 p-5 font-medium"
          role="status"
        >
          {copy.success}
        </p>
      ) : (
        <form
          aria-busy={isSubmitting}
          aria-describedby={`${formId}-description`}
          aria-labelledby={`${formId}-title`}
          className="mt-8 max-w-3xl"
          noValidate
          onInput={handleInput}
          onSubmit={handleSubmit}
        >
          <fieldset
            className="grid gap-6 border-0 p-0 disabled:opacity-80 sm:grid-cols-2"
            disabled={isSubmitting}
          >
            <legend className="sr-only">{heading.title}</legend>

            <Field
              error={fieldErrors[`${formId}-name`]}
              label={copy.name}
              labelFor={`${formId}-name`}
            >
              <input
                {...validationAttributes(fieldErrors, `${formId}-name`)}
                autoComplete="name"
                className={controlClassName}
                id={`${formId}-name`}
                maxLength={120}
                minLength={2}
                name="name"
                required
                type="text"
              />
            </Field>

            <Field
              error={fieldErrors[`${formId}-email`]}
              label={copy.email}
              labelFor={`${formId}-email`}
            >
              <input
                {...validationAttributes(fieldErrors, `${formId}-email`)}
                autoComplete="email"
                className={controlClassName}
                id={`${formId}-email`}
                maxLength={320}
                name="email"
                required
                type="email"
              />
            </Field>

            <Field
              error={fieldErrors[`${formId}-phone`]}
              label={copy.phone}
              labelFor={`${formId}-phone`}
            >
              <input
                {...validationAttributes(fieldErrors, `${formId}-phone`)}
                autoComplete="tel"
                className={controlClassName}
                id={`${formId}-phone`}
                maxLength={32}
                minLength={7}
                name="phone"
                pattern="\+?[0-9][0-9 ()-]*"
                type="tel"
              />
            </Field>

            {props.type === 'COMMISSION' ? (
              <Field
                error={fieldErrors[`${formId}-timeline`]}
                label={copy.timeline}
                labelFor={`${formId}-timeline`}
              >
                <input
                  {...validationAttributes(fieldErrors, `${formId}-timeline`)}
                  className={controlClassName}
                  id={`${formId}-timeline`}
                  maxLength={160}
                  minLength={2}
                  name="preferredTimeline"
                  type="text"
                />
              </Field>
            ) : null}

            {props.type === 'PRIVATE_VIEWING' ? (
              <>
                <Field
                  description={copy.preferredDatesDescription}
                  descriptionId={`${formId}-dates-description`}
                  error={fieldErrors[`${formId}-preferred-date`]}
                  label={copy.preferredDate}
                  labelFor={`${formId}-preferred-date`}
                >
                  <input
                    {...validationAttributes(
                      fieldErrors,
                      `${formId}-preferred-date`,
                      `${formId}-dates-description`,
                    )}
                    className={controlClassName}
                    id={`${formId}-preferred-date`}
                    name="preferredDates"
                    required
                    type="date"
                  />
                </Field>
                <Field
                  error={fieldErrors[`${formId}-attendees`]}
                  label={copy.attendees}
                  labelFor={`${formId}-attendees`}
                >
                  <input
                    {...validationAttributes(
                      fieldErrors,
                      `${formId}-attendees`,
                    )}
                    className={controlClassName}
                    id={`${formId}-attendees`}
                    inputMode="numeric"
                    max={12}
                    min={1}
                    name="attendees"
                    type="number"
                  />
                </Field>
                <Field
                  error={fieldErrors[`${formId}-second-date`]}
                  label={copy.secondDate}
                  labelFor={`${formId}-second-date`}
                >
                  <input
                    {...validationAttributes(
                      fieldErrors,
                      `${formId}-second-date`,
                      `${formId}-dates-description`,
                    )}
                    className={controlClassName}
                    id={`${formId}-second-date`}
                    name="preferredDates"
                    type="date"
                  />
                </Field>
                <Field
                  error={fieldErrors[`${formId}-third-date`]}
                  label={copy.thirdDate}
                  labelFor={`${formId}-third-date`}
                >
                  <input
                    {...validationAttributes(
                      fieldErrors,
                      `${formId}-third-date`,
                      `${formId}-dates-description`,
                    )}
                    className={controlClassName}
                    id={`${formId}-third-date`}
                    name="preferredDates"
                    type="date"
                  />
                </Field>
              </>
            ) : null}

            {props.type === 'GENERAL' ? (
              <div className="sm:col-span-2">
                <Field
                  error={fieldErrors[`${formId}-subject`]}
                  label={copy.subject}
                  labelFor={`${formId}-subject`}
                >
                  <input
                    {...validationAttributes(fieldErrors, `${formId}-subject`)}
                    className={controlClassName}
                    id={`${formId}-subject`}
                    maxLength={120}
                    minLength={2}
                    name="subject"
                    required
                    type="text"
                  />
                </Field>
              </div>
            ) : null}

            {props.type === 'COMMISSION' ? (
              <div className="sm:col-span-2">
                <Field
                  description={copy.commissionBriefDescription}
                  descriptionId={`${formId}-brief-description`}
                  error={fieldErrors[`${formId}-brief`]}
                  label={copy.commissionBrief}
                  labelFor={`${formId}-brief`}
                >
                  <textarea
                    {...validationAttributes(
                      fieldErrors,
                      `${formId}-brief`,
                      `${formId}-brief-description`,
                    )}
                    className={controlClassName}
                    id={`${formId}-brief`}
                    maxLength={4_000}
                    minLength={20}
                    name="brief"
                    required
                    rows={6}
                  />
                </Field>
              </div>
            ) : null}

            <div className="sm:col-span-2">
              <Field
                error={fieldErrors[`${formId}-message`]}
                label={props.type === 'GENERAL' ? copy.message : copy.note}
                labelFor={`${formId}-message`}
              >
                <textarea
                  {...validationAttributes(fieldErrors, `${formId}-message`)}
                  className={controlClassName}
                  id={`${formId}-message`}
                  maxLength={4_000}
                  minLength={10}
                  name="message"
                  required={props.type === 'GENERAL'}
                  rows={6}
                />
              </Field>
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-[10000px] h-px w-px overflow-hidden"
            >
              <label htmlFor={`${formId}-website`}>Website</label>
              <input
                autoComplete="off"
                id={`${formId}-website`}
                name="website"
                tabIndex={-1}
                type="text"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-start gap-3 border-t border-stone-400 pt-5">
                <input
                  {...validationAttributes(fieldErrors, `${formId}-consent`)}
                  className="mt-1 h-5 w-5 shrink-0 accent-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-900"
                  id={`${formId}-consent`}
                  name="consent"
                  required
                  type="checkbox"
                />
                <label
                  className="text-sm leading-6 text-stone-700"
                  htmlFor={`${formId}-consent`}
                >
                  {copy.consent}{' '}
                  <a
                    className="font-semibold text-stone-950 underline decoration-red-900 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-900"
                    href={privacyPolicyHref}
                  >
                    {copy.privacyPolicy}
                  </a>
                </label>
              </div>
              {fieldErrors[`${formId}-consent`] ? (
                <p
                  className="mt-2 text-sm font-medium text-red-950"
                  id={`${formId}-consent-error`}
                >
                  {fieldErrors[`${formId}-consent`]}
                </p>
              ) : null}
            </div>
          </fieldset>

          {Object.keys(fieldErrors).length > 0 ? (
            <p
              className="mt-5 border-l-2 border-red-900 pl-3 text-sm font-medium text-red-950"
              role="alert"
            >
              {copy.validationSummary}
            </p>
          ) : null}

          {error ? (
            <p
              aria-live="assertive"
              className="mt-5 border-l-2 border-red-900 pl-3 text-sm font-medium text-red-950"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-stone-400 pt-6">
            <button
              className="inline-flex min-h-12 items-center justify-center border border-red-950 bg-red-950 px-6 py-3 text-sm font-semibold tracking-[0.08em] text-stone-50 uppercase transition-colors hover:bg-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-950 disabled:cursor-wait disabled:opacity-60"
              disabled={isSubmitting || retryAfterSeconds !== null}
              type="submit"
            >
              {isSubmitting ? copy.sending : copy.action}
            </button>
            <span aria-live="polite" className="sr-only">
              {isSubmitting ? copy.sending : ''}
            </span>
          </div>
        </form>
      )}
    </section>
  )
}

const controlClassName =
  'min-h-12 w-full rounded-none border border-stone-500/70 bg-stone-50/60 px-3 py-2 text-base text-stone-950 shadow-sm transition-colors placeholder:text-stone-500 hover:border-stone-700 focus-visible:border-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-900 disabled:cursor-wait disabled:opacity-60'
const labelClassName = 'block text-sm font-semibold text-stone-900'
const descriptionClassName = 'mt-1 text-sm leading-6 text-stone-600'
const EMPTY_FIELD_ERRORS = Object.freeze({})
const FINGERPRINT_SUBMISSION_ID = '00000000-0000-4000-8000-000000000000'

function validationAttributes(
  errors: PublicInquiryFieldErrors,
  fieldId: string,
  descriptionId?: string,
) {
  const error = errors[fieldId]
  const describedBy = [descriptionId, error ? `${fieldId}-error` : null]
    .filter(Boolean)
    .join(' ')

  return {
    'aria-describedby': describedBy || undefined,
    'aria-invalid': error ? (true as const) : undefined,
  }
}

function Field({
  children,
  description,
  descriptionId,
  error,
  label,
  labelFor,
}: Readonly<{
  children: React.ReactNode
  description?: string
  descriptionId?: string
  error?: string
  label: string
  labelFor: string
}>) {
  return (
    <div>
      <label className={labelClassName} htmlFor={labelFor}>
        {label}
      </label>
      {description ? (
        <p className={descriptionClassName} id={descriptionId}>
          {description}
        </p>
      ) : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p
          className="mt-2 text-sm font-medium text-red-950"
          id={`${labelFor}-error`}
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
