interface TranslationObject {
  readonly [key: string]: string | TranslationObject
}
type TranslationOverride = Readonly<{key: string; value: string}>

const SAFE_SEGMENT = /^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u
const MAX_TRANSLATION_LENGTH = 5_000

function isSafeSegment(segment: string) {
  return (
    SAFE_SEGMENT.test(segment) &&
    segment.trim() === segment &&
    !['constructor', 'prototype', '__proto__'].includes(segment)
  )
}

function safeSegments(key: string) {
  const segments = key.split('.')

  if (
    segments.length === 0 ||
    segments.some(segment => !isSafeSegment(segment))
  ) {
    throw new Error('TRANSLATION_KEY_INVALID')
  }

  return segments
}

function flattenEntries(
  catalog: TranslationObject,
  prefix = '',
): readonly (readonly [string, string])[] {
  return Object.entries(catalog).flatMap(([segment, value]) => {
    if (!isSafeSegment(segment)) {
      throw new Error('TRANSLATION_KEY_INVALID')
    }

    const key = prefix ? `${prefix}.${segment}` : segment

    if (typeof value === 'string') return [[key, value] as const]

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('TRANSLATION_CATALOG_INVALID')
    }

    return flattenEntries(value, key)
  })
}

function validateTranslationKey(key: string) {
  safeSegments(key)

  return key
}

function nestedValue(
  catalog: TranslationObject,
  segments: readonly string[],
  value: string,
): TranslationObject {
  const [segment, ...remaining] = segments

  if (!segment) return catalog

  if (remaining.length === 0) {
    return Object.freeze({...catalog, [segment]: value})
  }

  const current = catalog[segment]
  const child =
    current && typeof current === 'object' && !Array.isArray(current)
      ? current
      : Object.freeze({})

  return Object.freeze({
    ...catalog,
    [segment]: nestedValue(child, remaining, value),
  })
}

function unflattenTranslationCatalog(
  catalog: Readonly<Record<string, string>>,
): TranslationObject {
  return Object.entries(catalog).reduce<TranslationObject>(
    (result, [key, value]) => nestedValue(result, safeSegments(key), value),
    Object.freeze({}),
  )
}

function flattenTranslationCatalog(catalog: TranslationObject) {
  return Object.freeze(Object.fromEntries(flattenEntries(catalog)))
}

function translationArgumentNames(message: string) {
  const arguments_ = new Set<string>()
  let depth = 0

  for (let index = 0; index < message.length; index += 1) {
    const character = message[index]

    if (character === '{') {
      if (depth === 0) {
        const candidate = message
          .slice(index + 1)
          .match(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*(?:,|\})/u)?.[1]

        if (!candidate) throw new Error('TRANSLATION_MESSAGE_INVALID')

        arguments_.add(candidate)
      }

      depth += 1
    } else if (character === '}') {
      depth -= 1

      if (depth < 0) throw new Error('TRANSLATION_MESSAGE_INVALID')
    }
  }

  if (depth !== 0) throw new Error('TRANSLATION_MESSAGE_INVALID')

  return Object.freeze([...arguments_].sort())
}

function validateTranslationValue({
  source,
  value,
}: Readonly<{source: string; value: string}>) {
  const normalized = typeof value === 'string' ? value.trim() : ''

  if (!normalized || normalized.length > MAX_TRANSLATION_LENGTH) {
    throw new Error('TRANSLATION_VALUE_INVALID')
  }

  const sourceArguments = translationArgumentNames(source)
  const translatedArguments = translationArgumentNames(normalized)

  if (
    sourceArguments.length !== translatedArguments.length ||
    sourceArguments.some(
      (argument, index) => argument !== translatedArguments[index],
    )
  ) {
    throw new Error('TRANSLATION_ARGUMENTS_MISMATCH')
  }

  return normalized
}

function mergeTranslationCatalog({
  canonical,
  localized,
  overrides,
}: Readonly<{
  canonical: TranslationObject
  localized: TranslationObject
  overrides: readonly TranslationOverride[]
}>) {
  const canonicalFlat = flattenTranslationCatalog(canonical)
  const localizedFlat = flattenTranslationCatalog(localized)
  const knownKeys = new Set(Object.keys(canonicalFlat))

  for (const key of Object.keys(localizedFlat)) {
    if (!knownKeys.has(key)) throw new Error('TRANSLATION_KEY_UNKNOWN')
  }

  const validatedLocalized = Object.fromEntries(
    Object.entries(localizedFlat).map(([key, value]) => [
      key,
      validateTranslationValue({source: canonicalFlat[key]!, value}),
    ]),
  )
  const validatedOverrides = Object.fromEntries(
    overrides.map(override => {
      if (!knownKeys.has(override.key)) {
        throw new Error('TRANSLATION_KEY_UNKNOWN')
      }

      return [
        override.key,
        validateTranslationValue({
          source: canonicalFlat[override.key]!,
          value: override.value,
        }),
      ]
    }),
  )

  return unflattenTranslationCatalog(
    Object.freeze({
      ...canonicalFlat,
      ...validatedLocalized,
      ...validatedOverrides,
    }),
  )
}

export type {TranslationObject, TranslationOverride}

export {
  flattenTranslationCatalog,
  mergeTranslationCatalog,
  translationArgumentNames,
  validateTranslationKey,
  validateTranslationValue,
}
