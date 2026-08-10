import type {EditorialJsonValue, EditorialSnapshot} from './contracts'

const forbiddenObjectKeys = new Set(['__proto__', 'constructor', 'prototype'])

function cloneJsonValue(
  value: unknown,
  ancestors: ReadonlySet<object>,
): EditorialJsonValue {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return value
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Editorial snapshots require finite numbers')
    }

    return value
  }

  if (typeof value !== 'object') {
    throw new TypeError('Editorial snapshots must contain only JSON values')
  }

  if (ancestors.has(value)) {
    throw new TypeError('Editorial snapshots cannot contain circular values')
  }

  const nextAncestors = new Set(ancestors).add(value)

  if (Array.isArray(value)) {
    return Object.freeze(
      Array.from(value, item => cloneJsonValue(item, nextAncestors)),
    )
  }

  const prototype = Object.getPrototypeOf(value)

  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('Editorial snapshots require plain JSON objects')
  }

  const entries = Object.entries(value)

  if (entries.some(([key]) => forbiddenObjectKeys.has(key))) {
    throw new TypeError('Editorial snapshot contains an unsafe object key')
  }

  return Object.freeze(
    Object.fromEntries(
      entries.map(([key, item]) => [key, cloneJsonValue(item, nextAncestors)]),
    ),
  )
}

export function toImmutableEditorialSnapshot(
  value: unknown,
): EditorialSnapshot {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new TypeError('Editorial snapshot must be a JSON object')
  }

  return cloneJsonValue(value, new Set()) as EditorialSnapshot
}
