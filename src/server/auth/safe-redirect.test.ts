import {describe, expect, it} from 'vitest'

import {safeAuthRedirect, safeRedirectPath} from './safe-redirect'

describe('safeRedirectPath', () => {
  it('keeps a same-origin absolute path with query and fragment', () => {
    expect(safeRedirectPath('/tr/admin/users?page=2#results', '/tr')).toBe(
      '/tr/admin/users?page=2#results',
    )
  })

  it.each([
    'https://attacker.example/steal',
    '//attacker.example/steal',
    '\\\\attacker.example\\steal',
    'javascript:alert(1)',
    '/%2f%2fattacker.example',
  ])('rejects an unsafe redirect target: %s', target => {
    expect(safeRedirectPath(target, '/en')).toBe('/en')
  })

  it('uses the fallback for missing values', () => {
    expect(safeRedirectPath(null, '/en')).toBe('/en')
  })

  it('normalizes an unsafe fallback to the application root', () => {
    expect(safeRedirectPath('profile', '//attacker.example')).toBe('/')
  })

  it('rejects control characters and malformed escape sequences', () => {
    expect(safeRedirectPath('/en\nadmin', '/en')).toBe('/en')
    expect(safeRedirectPath('/%', '/en')).toBe('/en')
  })
})

describe('safeAuthRedirect', () => {
  it('accepts an absolute URL only when it matches the configured origin', () => {
    expect(
      safeAuthRedirect(
        'https://bekten.art/tr/admin',
        'https://bekten.art',
        '/en',
      ),
    ).toBe('https://bekten.art/tr/admin')
  })

  it('maps relative paths to the configured origin', () => {
    expect(safeAuthRedirect('/tr/profile', 'https://bekten.art', '/en')).toBe(
      'https://bekten.art/tr/profile',
    )
  })

  it('rejects a foreign origin', () => {
    expect(
      safeAuthRedirect(
        'https://attacker.example/steal',
        'https://bekten.art',
        '/en',
      ),
    ).toBe('https://bekten.art/en')
  })

  it('rejects a malformed absolute URL', () => {
    expect(
      safeAuthRedirect('https://[invalid', 'https://bekten.art', '/en'),
    ).toBe('https://bekten.art/en')
  })
})
