export type PublicInquiryFieldErrors = Readonly<Record<string, string>>

export type PublicInquiryValidationMessages = Readonly<{
  invalid: string
  required: string
}>

type ValidatableControl =
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

function isValidatableControl(element: Element): element is ValidatableControl {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  )
}

export function validatePublicInquiryForm(
  form: HTMLFormElement,
  messages: PublicInquiryValidationMessages,
) {
  const invalidControls = Array.from(form.elements)
    .filter(isValidatableControl)
    .filter(control => control.willValidate && !control.validity.valid)
  const errors = Object.freeze(
    Object.fromEntries(
      invalidControls.map(control => [
        control.id,
        control.validity.valueMissing ? messages.required : messages.invalid,
      ]),
    ),
  )

  return Object.freeze({errors, firstInvalid: invalidControls[0] ?? null})
}
