import {describe, expect, it} from 'vitest'

import {toImmutableEditorialSnapshot} from './snapshot'

describe('immutable editorial snapshots', () => {
  it('copies and deeply freezes JSON data without changing the source', () => {
    const source = {
      available: true,
      count: 2,
      media: [{alt: 'Kyrgyz landscape', objectKey: null}],
      title: 'Silent Steppe',
    }

    const snapshot = toImmutableEditorialSnapshot(source)
    const media = snapshot.media

    if (!Array.isArray(media)) throw new Error('Expected a media array')

    expect(snapshot).toEqual(source)
    expect(snapshot).not.toBe(source)
    expect(media).not.toBe(source.media)
    expect(Object.isFrozen(snapshot)).toBe(true)
    expect(Object.isFrozen(media)).toBe(true)
    expect(Object.isFrozen(media[0])).toBe(true)
    expect(source).toEqual({
      available: true,
      count: 2,
      media: [{alt: 'Kyrgyz landscape', objectKey: null}],
      title: 'Silent Steppe',
    })
  })

  it.each([null, [], 'title', 1, true])(
    'rejects a non-object root: %o',
    value => {
      expect(() => toImmutableEditorialSnapshot(value)).toThrow(
        'Editorial snapshot must be a JSON object',
      )
    },
  )

  it.each([
    {value: Number.NaN},
    {value: Number.POSITIVE_INFINITY},
    {value: undefined},
    {value: 1n},
    {value: () => 'not JSON'},
    {value: new Date('2026-08-10T12:00:00.000Z')},
  ])('rejects a non-JSON nested value: $value', ({value}) => {
    expect(() => toImmutableEditorialSnapshot({value})).toThrow()
  })

  it('rejects circular objects', () => {
    const circular: Record<string, unknown> = {}

    circular.self = circular

    expect(() => toImmutableEditorialSnapshot(circular)).toThrow(
      'Editorial snapshots cannot contain circular values',
    )
  })

  it('rejects sparse arrays instead of changing their JSON meaning', () => {
    const sparse = Array(2) as unknown[]

    sparse[1] = 'second item'

    expect(() => toImmutableEditorialSnapshot({sparse})).toThrow(
      'Editorial snapshots must contain only JSON values',
    )
  })

  it.each(['__proto__', 'constructor', 'prototype'])(
    'rejects the unsafe %s key',
    key => {
      const value = Object.create(null) as Record<string, unknown>

      value[key] = 'unsafe'

      expect(() => toImmutableEditorialSnapshot(value)).toThrow(
        'Editorial snapshot contains an unsafe object key',
      )
    },
  )
})
