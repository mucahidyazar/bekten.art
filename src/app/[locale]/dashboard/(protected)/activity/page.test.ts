import {describe, expect, it} from 'vitest'

import {activityPageNumber} from './activity-page-number'

describe('activityPageNumber', () => {
  it.each([
    {expected: 1, value: undefined},
    {expected: 1, value: 'not-a-number'},
    {expected: 1, value: '-4'},
    {expected: 3, value: '3'},
    {expected: 1_000, value: '1001'},
    {expected: 1_000, value: '999999'},
  ])('normalizes $value to $expected', ({expected, value}) => {
    expect(activityPageNumber(value)).toBe(expected)
  })
})
